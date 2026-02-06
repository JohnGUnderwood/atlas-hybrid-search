#!/bin/bash
source .env
echo "Using args ${MDBCONNSTR}"
echo "Using args ${OPENAIAPIKEY}"

echo
echo "+================================"
echo "| START: ATLAS HYBRID SEARCH"
echo "+================================"
echo

datehash=`date | md5sum | cut -d" " -f1`
abbrvhash=${datehash: -8}

echo 
echo "Building container using tag ${abbrvhash}"
echo
docker build -t atlashybridsearch:latest -t atlashybridsearch:${abbrvhash} --platform=linux/amd64 .

EXITCODE=$?

if [ $EXITCODE -eq 0 ]
    then

    echo 
    echo "Starting container"
    echo
    docker stop atlashybridsearch
    docker rm atlashybridsearch
    docker run -t -i -d -p 5050:3000 --name atlashybridsearch -e "MDBCONNSTR=${MDBCONNSTR}" -e "OPENAIAPIKEY=${OPENAIAPIKEY}" -e "OPENAIDEPLOYMENT=${OPENAIDEPLOYMENT}" -e "OPENAIENDPOINT=${OPENAIENDPOINT}" --restart unless-stopped johnunderwood197/atlashybridsearch:latest

    echo
    echo "+================================"
    echo "| END:  ATLAS HYBRID SEARCH"
    echo "+================================"
    echo
else
    echo
    echo "+================================"
    echo "| ERROR: Build failed"
    echo "+================================"
    echo
fi