## Integrating Watson Conversation Service with SmartBox Service

* Login to Bluemix and click on the Conversation service which you created.

* Now click on Service Credentials
    * Click on View Credentials
    * Copy the username and password

* Now click on Manage
    * Click on Launch tool
    * Click on More options icon of the workspace which you want to use and then click View details
    * Copy the Workspace ID

* Now add the username, password and workspace ID in config/config.js under 'watsonCoversation'
    ```
    const watsonCoversation = {
        url: 'https://gateway.watsonplatform.net/conversation/api',
        version_date: '2016-10-21',
        version: 'v1',
        workspaceId: [Workspace ID],
        workspaceUserName: [username],
        workspacePassword: [password]
    };
    ```

* Copy the Conversation service name and add it manifest.yml
    * Under 'declared-services'
    ```
        declared-services:
          SmartBox-Conversation:
            label: conversation
            plan: free
    ```
    * Under 'services'
    ```
        services:
        - SmartBox-Conversation
    ```

## Integrating Watson Discovery Service with SmartBox Service

* Login to Bluemix and click on the Discovery service which you created.

* Now click on Service Credentials
    * Click on View Credentials
    * Copy the username and password

* Now click on Manage
    * Click on Launch tool
    * Click on the collection which you want to use and then click View details
    * Copy the collection_id, environment_id and collection name

* Now add the username, password collection_id, environment_id and collection name in config/config.js under 'watsonDiscovery'
    ```
    const watsonDiscovery = {
        username: [username],
        password: [password],
        version: 'v1',
        version_date: '2016-12-01',
        environment_id: [environment_id],
        defaultCollection: 'customerDB-UK',
        collection_id: {
            [collection name]: [collection_id],
        }
    };
    ```