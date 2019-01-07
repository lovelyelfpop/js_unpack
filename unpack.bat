@echo off
title unpack js

set /p pp=input js file path:

set FilePath=%pp%

call node index.js

pause