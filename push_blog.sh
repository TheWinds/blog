echo "更新说明:$1"
hugo && git add . && git commit -m "$1" && git push