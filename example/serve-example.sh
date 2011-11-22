#!/bin/bash

DIR="$( cd -P "$( dirname "$0" )" && pwd )"

cd $DIR
echo "Working in $DIR"

java -jar ../../../bin/plovr.jar serve ./plovr-config.js

