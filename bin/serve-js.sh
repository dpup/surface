#!/bin/bash
# Shell script that sets up Plovr to compile and serve the example javascript.
# Server will run on localhost:9810.

DIR="$( cd -P "$( dirname "$0" )" && pwd )"
cd $DIR
java -jar ./plovr.jar serve ./plovr-config-sample-app.js
