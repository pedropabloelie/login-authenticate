
## About Login Authenticate

The login form contain register account, verify account sending email whit token, reset password, recovery password, aunthenticate. to run the project you must have installed 
*Node.JS* 


Copy the .env.example file and generate an .env to configure the connection parameters and other parameters.

## Requirements

-  [Node](https://nodejs.org/es/) ^ **14.15.4**

    -  [npm](https://nodejs.org/es/) ^ **6.14.10**



##### To run 
```
- Run `npm install`
- Run `npm server`
- Run `npm css`
 ```

 ## For DB you can use Docker.

for database you can use docker. The docker-compose.yml file will create the container corresponding to the mysql image.

The storage folder contains a .env.mysql.example file which you should copy and create an .env.mysql file with the credentials you want for the docker database.

##### To run 

```
- Run `docker-compse up -d`
- Run `npm server`
- Run `npm css`
 ```
