param name string = 'pulse'

param location string = resourceGroup().location

resource mongoCluster 'Microsoft.DocumentDB/mongoClusters@2023-03-01-preview' = {
  name: 'cosmon-${name}-prod'
  location: location
  properties: {
    administratorLogin: 'default'
    administratorLoginPassword: 'T8sSufqGMkRKh3YAdXWjDU'
    serverVersion: '6.0'
    nodeGroupSpecs: [
      {
        kind: 'Shard'
        nodeCount: 1
        sku: 'M40'
        diskSizeGB: 256
        enableHa: false
      }
    ]
  }
}

resource symbolicname 'Microsoft.DocumentDB/mongoClusters/firewallRules@2023-03-01-preview' = {
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  parent: mongoCluster
  properties: {
    endIpAddress: '0.0.0.0'
    startIpAddress: '0.0.0.0'
  }
}

resource operationalInsightsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: 'law-${name}-prod'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource insightsComponent 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${name}-prod'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: operationalInsightsWorkspace.id
    Flow_Type: 'Bluefield'
  }
}

resource webServerfarm 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'asp-${name}-prod'
  location: location
  kind: 'linux'
  sku: {
    name: 'P1V3'
    tier: 'PremiumV3'
  }
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: 'app-${name}-prod-001'
  location: location
  properties: {
    serverFarmId: webServerfarm.id
    siteConfig: {
      appSettings: [
        {
          name: 'CUSTOM_APPINSIGHTS_INSTRUMENTATIONKEY'
          value: insightsComponent.properties.InstrumentationKey
        }
        {
          name: 'CUSTOM_APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: insightsComponent.properties.ConnectionString
        }
        {
          name: 'MONGODB_CONNECTION_STRING'
          value: 'mongodb+srv://default:T8sSufqGMkRKh3YAdXWjDU@cosmon-pulse-prod.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000'
        }
      ]
      alwaysOn: true
      http20Enabled: true
      linuxFxVersion: 'NODE|18-lts'
    }
  }
}
