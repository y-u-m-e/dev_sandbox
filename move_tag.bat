git tag -f live
git push -f origin refs/tags/live
curl -s "https://purge.jsdelivr.net/gh/y-u-m-e/dev_sandbox@live/dist/dev_sandbox_widget.js"
pause