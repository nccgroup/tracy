./node_modules/web-ext/bin/web-ext run -s build --no-input true & echo "$(find public) $(find src)" | entr sh -c "npm run build" 
