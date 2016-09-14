#!/bin/bash

git add .
echo -e "Please enter your commit message: "
read message
git commit -m "$message"
git push heroku master
