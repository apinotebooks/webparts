# api-notebook-webpart

## Summary

Provides API Notebooks webpart

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.12-green.svg)

## Test 

Local testing with the workbench is possible. request is only available when running in SharePoint.

```
gulp serve 
```


## Build 

```
gulp build 
gulp bundle --ship
gulp package-solution --ship
```


## Deploy

Get the webpart solution package file `api-notebook-webpart.sppkg` from `sharepoint\solution`

Go to your SharePoint Catalog site `https://<org>.sharepoint.com/sites/appcatalog/AppCatalog/Forms/AllItems.aspx` and upload in `Apps for SharePoint`. Then click deploy.

Approve app permission request once at `https://<org>-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement`