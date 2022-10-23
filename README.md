# Word counter service

## Installation and Usage Instructions
1. Clone this repo using ```git clone .. ```
2. Install all packages using the command: ```npm i``` 
3. To run the server use the command: ```npm run start```

Once you have done the above, the server will listen on ```http://localhost:3000```

## Word Counter Api 

1. ```post /word-counter``` will receive a request with a body including two parameters:
    *   ```inputType``` - a string representing the input type, can only be one of the following words: ```string | url | file```.
        
         Any other input type will result in a 404 error response.
    * ```input``` - a string , url or path to a file
2. ```get /word-statistics``` will receive a payload (body) with the object ```{word: <query-word>}```


## Assumptions
1. Input of type url for requests to the ```/word-counter``` api route  will always be valid, i.e ```get(<inputUrl>)``` will never return an error. I decided to make this assumption since the task requires handling large inputs, and in order to check if the request to the url is valid then ill have to read the file. 
2. Any api call after a ```/word-counter``` api call with large input requests will happen in a reasonable time for the words to be counted for such a large input.  (see note no. 1)


## Notes
1. In order for all the responses to be quick enough ,if the input provided is valid then the a success response will be returned and the word counting processing will continue until finishes.
Therefore, In the case of the server shuting down before it finished counting a large input's words, then it would be as if the words were not counted at all. 

## The project Includes  
* src folder with all the server code:
- fastify : to run the server 
- 
* test folder with all tests and test utils () : 
-   I used mocha to run the test

* Types: I chose to use jsdoc since I sincerely believe transpilation creates a lot overhead. 
    JSdoc is a markup language used to annotate JavaScript source code files using comments.
    JSDoc has a feature of defining types with @typedef tag. TS supports it an once running 