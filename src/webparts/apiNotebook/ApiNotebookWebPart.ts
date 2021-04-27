import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
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
  interactiveMode: boolean;
}

export default class ApiNotebookWebPart extends BaseClientSideWebPart<IApiNotebookWebPartProps> {


  public render(): void {

    this.context.statusRenderer.displayLoadingIndicator(this.domElement, '');

    if (window.location.host.indexOf("localhost")==0) {
      // ignore token on localhost
        this.renderNotebook("");
    } else {
      this.context.aadTokenProviderFactory
        .getTokenProvider()
        .then((tokenProvider: AadTokenProvider): Promise<string> => {
          debugger;
          // retrieve access token for the enterprise API secured with Azure AD
          // the parameter passed into getToken()is the Application ID URI
          return tokenProvider.getToken('https://graph.microsoft.com');
        })
        .then((accessToken: string): void => {
          this.renderNotebook(accessToken);
        });
    }

    return;
  }

  private renderNotebook(accessToken: string): void {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement);

    console.log("render " + (this.displayMode == DisplayMode.Edit ? "edit" : "view"));

    var sbId = "api-sandbox-" + this.instanceId.split("-").join("");

    var sb = document.getElementById(sbId);
    if (sb) sb.classList.toggle("hidden", true);

    var editMode: string = this.displayMode == DisplayMode.Edit ? "edit" : "view";
    if(this.properties.interactiveMode) editMode = "edit";

    var variables: any = this.getUrlParameters(); // initialize variables with location parameters
    if(accessToken) variables._token = "office-365:" + accessToken;

    if (!sb) {
      var opts = {
        notebookContainer: this,
        notebookContent: this.properties.notebookContent,
        notebookVariables: variables,
        debug: false,
        notebookEditMode: editMode,
        src: "https://apinotebooks-sandbox.netlify.app",
        onContentUpdateMessage: function (evt) {
          this.notebookContainer.properties.notebookContent = evt.content;
        },
        /* tslint:disable:no-function-expression */
        onMessage: function (evt) {
          if(evt.type=="NAVIGATE_TO") {
            window.parent.location = evt.url;
          }
        }
      };

      sb = new StarboardNotebookIFrame(opts);

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
  }

  /* tslint:disable:no-function-expression */
  private getUrlParameters(): any {

    var query = window.location.search;
    query = query.substring(query.indexOf('?') + 1);

    var re = /([^&=]+)=?([^&]*)/g;
    var decodeRE = /\+/g;

    var decode = function (str) {
      return decodeURIComponent(str.replace(decodeRE, " "));
    };

    var params = {}, e;
    while (e = re.exec(query)) {
      var k = decode(e[1]), v = decode(e[2]);
      if (k.substring(k.length - 2) === '[]') {
        k = k.substring(0, k.length - 2);
        (params[k] || (params[k] = [])).push(v);
      }
      else params[k] = v;
    }

    var assign = function (obj, keyPath, value) {
      var lastKeyIndex = keyPath.length - 1;
      for (var i = 0; i < lastKeyIndex; ++i) {
        var key = keyPath[i];
        if (!(key in obj)) obj[key] = {};
        obj = obj[key];
      }
      obj[keyPath[lastKeyIndex]] = value;
    };

    for (var prop in params) {
      var structure = prop.split('[');
      if (structure.length > 1) {
        var levels = [];
        structure.forEach(function (item, i) {
          var key = item.replace(/[?[\]\\ ]/g, '');
          levels.push(key);
        });
        assign(params, levels, params[prop]);
        delete (params[prop]);
      }
    }

    return params;
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
                }),              
                PropertyPaneToggle('interactiveMode', {
                  label: strings.InteractiveModeLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
