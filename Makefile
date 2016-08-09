.PHONY: clean

lambda:
	npm install .
	@echo "Factory package files..."
	@if [ ! -d build ] ;then mkdir build; fi
	@cp index.js build/index.js
	@if [ -d build/node_modules ] ;then rm -rf build/node_modules; fi
	@cp -R node_modules build/node_modules
	@cp -R lib build/
	@cp -R config build/
	@echo "Create package archive..."
	@cd build && zip -rq aws-lambda-ecr-cleaner.zip .
	@mv build/aws-lambda-ecr-cleaner.zip ./
	@echo "clean up package files"
	@rm -rf build/*



clean:
	@echo "clean up package files"
	@if [ -f aws-lambda-ecr-cleaner.zip ]; then rm aws-lambda-ecr-cleaner.zip; fi
	@rm -rf build/*
