import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
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

    console.log("render " + (this.displayMode == DisplayMode.Edit ? "edit" : "view"));

    var sbId = "api-sandbox-" + this.instanceId.split("-").join("");

    var sb = document.getElementById(sbId);
    if (sb) sb.classList.toggle("hidden", true);
    if (!sb) {
      sb = new StarboardNotebookIFrame({
        notebookContainer: this,
        notebookContent: this.properties.notebookContent,
        notebookVariables: {},
        debug: false,
        notebookEditMode: this.displayMode == DisplayMode.Edit ? "edit" : "view",
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
      sb.notebookVariables = {};    
      // @ts-ignore    
      sb.notebookEditMode = this.displayMode == DisplayMode.Edit ? "edit" : "view";
      // @ts-ignore
      sb.sendMessage({
        type: "NOTEBOOK_RELOAD_PAGE"
      });
      sb.classList.toggle("hidden", false);
    }

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
