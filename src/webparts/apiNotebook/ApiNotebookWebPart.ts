import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { AadTokenProvider } from '@microsoft/sp-http';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './ApiNotebookWebPart.module.scss';
import * as strings from 'ApiNotebookWebPartStrings';

import { StarboardNotebookIFrame } from './libs/notebook-sandbox';

export interface IApiNotebookWebPartProps {
  description: string;
  notebookContent: string;
}

export default class ApiNotebookWebPart extends BaseClientSideWebPart<IApiNotebookWebPartProps> {


  public render(): void {

    this.context.statusRenderer.displayLoadingIndicator(this.domElement, '');

    this.context.aadTokenProviderFactory
      .getTokenProvider()
      .then((tokenProvider: AadTokenProvider): Promise<string> => {
        debugger;
        // retrieve access token for the enterprise API secured with Azure AD
        // the parameter passed into getToken()is the Application ID URI
        return tokenProvider.getToken('https://graph.microsoft.com');
      })
      .then((accessToken: string): void => {

        this.context.statusRenderer.clearLoadingIndicator(this.domElement);

        console.log("render " + (this.displayMode == DisplayMode.Edit ? "edit" : "view"));

        var sbId = "api-sandbox-" + this.instanceId.split("-").join("");

        var sb = document.getElementById(sbId);
        if (sb) sb.classList.toggle("hidden", true);

        var editMode:string =  this.displayMode == DisplayMode.Edit ? "edit" : "view";
        var variables:any = {};
        variables._token = "office-365:" + accessToken;

        if (!sb) {
          sb = new StarboardNotebookIFrame({
            notebookContainer: this,
            notebookContent: this.properties.notebookContent,
            notebookVariables: variables,
            debug: false,
            notebookEditMode: editMode,
            src: "https://apinotebooks-sandbox.netlify.app",
            onContentUpdateMessage: function (evt) {
              this.notebookContainer.properties.notebookContent = evt.content;
            }
          });

          sb.style.width = "100%";
          sb.id = sbId;
          this.domElement.innerHTML = "";
          this.domElement.appendChild(sb);
        } else {
          // reload instance with new content  
          // @ts-ignore    
          sb.notebookContent = this.properties.notebookContent;
          // @ts-ignore
          sb.notebookVariables = variables;
          // @ts-ignore    
          sb.notebookEditMode = editMode;
          // @ts-ignore
          sb.sendMessage({
            type: "NOTEBOOK_RELOAD_PAGE"
          });
          sb.classList.toggle("hidden", false);
        }

      });


    return;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
