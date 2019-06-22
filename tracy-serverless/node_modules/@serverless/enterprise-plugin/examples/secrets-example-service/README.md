# Secrets Usage Example

## Instructions

### 1. Make sure you have no default AWS credentials set.

1. Check whether you have an AWS credentials file:
   ```sh
   cat ~/.aws/credentials
   ```
2. If you receive the message "`No such file or directory`" you may skip to the next section.
3. If the file exists, you should rename this file temporarily, to guarantee that the credentials saved in it are not being used for deployment.
   ```sh
   mv ~/.aws/credentials ~/.aws/credentials.bak
   ```

### 2. Choose or create an app to use for testing.

1. Open https://dashboard.serverless-dev.com/
2. If you do not have an app that you'd like to deploy the test service to, create a new one.
3. Once you've chosen which app you will use, make note of its name. You will use it in the next step.

### 3. Log out from any company AWS accounts.

If you are logged into the AWS console with a shared company account, sign out: https://console.aws.amazon.com/dynamodb/logout!doLogout

### 4. Link your AWS account.

1. Open https://dashboard.serverless-dev.com/
2. Once logged in, click "**secure**" near the top of the page.
3. Click the "**+ add**" button on the right, and choose "**aws**".
4. In the modal that appears, click "**Click here to add a role**".
5. Login to **your personal AWS account** if prompted. Otherwise, verify that you are already logged into a personal account, and not a Serverless infrastructure account.
6. Click "**Next: Permissions**" to proceed to the permissions page.
7. Tick the box next to the **AdministratorAccess** policy.
8. Click "**Next**" two more times to proceed to the Review page.
7. On the review page, enter any distinctive name (e.g. "ServerlessEnterprise") in the "**Role name**" field.
8. Click the "**Create role**" button and you will be brought back to the list of IAM roles.
9. Locate the role you just created in the list, and click its name.
10. On the summary page, next to the "**Role ARN**", click the copy icon (**🗐**).
11. Switch back to the Serverless Enterprise tab, and paste the copied ARN into the ARN blank for step 3 of the modal.
12. For step 4 of the modal, enter "my-secret" as the secret name.
13. Click "**create secret**".
14. Under the "Allow only the following applications..." prompt, tick the name of the application you previously chose to use.
15. Once the application is ticked, click "**save changes**".

### 5. Set up the example service.

1. Make sure your Serverless Framework is up to date: `npm i -g serverless`
2. Open a shell, and run this command:
   ```sh
   curl -s https://raw.githubusercontent.com/serverless/enterprise-plugin/master/examples/secrets-example-service/download.sh | sh
   ```
3. You should now have a new directory `secrets-example-service`. Change into that directory:
   ```sh
   cd secrets-example-service
   ```
4. Edit the file `serverless.yml`, replacing each value identified by a "_REPLACE_" comment with the appropriate value, i.e. your tenant name, application name, and secret name (if you chose something other than "_my-secret_").

### 6. Deploy the service.

1. Set the platform stage to `dev`. NOTE: This must be done each time you open a new console.
   ```sh
   export SERVERLESS_PLATFORM_STAGE=dev
   ```
2. Run the following command to log in (from the `secrets-example-service` directory):
   ```sh
   serverless login
   ```
   Follow the prompts and you should receive a message that you've succesfully logged in and may close the browser tab. In the console, you should see `Serverless Enterprise: You sucessfully logged in to Serverless Enterprise.`
3. Deploy the application:
   ```sh
   serverless deploy
   ```
4. Wait for the deployment to complete. If you receive no error, test the deployed function by invoking it.
   ```sh
   serverless invoke -f hello
   ```
5. Check the Serverless Dashboard to verify that the new service appears within the application.

### 7. Test application restriction.

1. Edit `serverless.yml` again, and change the `app` property to the name of any other application within your tenant, i.e. one that you did _not_ whitelist for use of this secret.
2. Attempt to deploy the application again:
   ```sh
    serverless deploy
     ```
3. You should receive an error that use of the secret is not allowed.
