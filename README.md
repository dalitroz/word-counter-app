# Word counter service

## Installation and Usage Instructions
1. Clone this repo using `git clone git@github.com:dalitroz/word-counter-app.git`
2. Install all packages using the command: `npm i`
3. To run the server use the command: `npm run start`

    Once you have done the above, the server will listen at `http://localhost:3000`
4. To run the tests use one of the following commands:
    * `npm run t` 
    * `npm run test`
    * `npm run mocha` 

## Word Counter Api 

1. `post /word-counter` will receive a request with a body including two parameters:
    *   `inputType` - a string representing the input type, can only be one of the following words: `string | url | file`.
        
         Any other input type will result in a 404 error response.
    * `input` - a string , url or path to a file
2. `get /word-statistics` will receive a payload (body) with the object `{word: <query-word>}`


## Assumptions
*  Input of type url for requests to the `/word-counter` api route  will always be valid, i.e `get(<inputUrl>)` will never return an error. I decided to make this assumption since the task requires handling large inputs, and in order to check if the request to the url is valid then ill have to read the file. 

## The project Includes  
* `src` dir with all the server code:
    * `fastify` framework to run the server 
* `test` dir with all tests and a `test-utils` dir: 
    * `mocha` to run the tests

* Types: I chose to use `JSDoc` since I sincerely believe transpilation creates a lot overhead and it is very neat as well (All supported natively by `TS`: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) . 
    JSdoc is a markup language used to annotate JavaScript source code files using comments.
    JSDoc has a feature of defining types with @typedef tag. 


## Notes

* The test for the `really-large-input.txt` (1.5GB) is skipped since github doesnt allow to upload files larger than 100MB, if want to run it anyway just do the following :

   * Remove `skip` from the test 
   * Create a file with that name under `test-utils` dir
   * Run the bash command `yes "I am Sasha fierce" | head -c 1500000000 > really-large-input.txt` 
   * Replace the last word  in the file with the word 'Beyonce'. :) 
### Room for improvements ( If I had more time )
* The response time for large inputs could probably be improved by splitting the input chunks further and running the `countWords` function in parallel. 
