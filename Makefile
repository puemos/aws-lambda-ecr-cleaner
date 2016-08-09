.PHONY: clean

lambda:
	npm install .
	@echo "Factory package files..."
	@if [ ! -d build ] ;then mkdir build; fi
	@cp index.js build/index.js
	@cp config.json build/config.json
	@if [ -d build/node_modules ] ;then rm -rf build/node_modules; fi
	@cp -R node_modules build/node_modules
	@cp -R libs build/
	@cp -R bin build/
	@rm -rf build/bin/darwin
	@echo "Create package archive..."
	@cd build && zip -rq aws-lambda-ecr-cleaner.zip .
	@mv build/aws-lambda-ecr-cleaner.zip ./



clean:
	@echo "clean up package files"
	@if [ -f aws-lambda-ecr-cleaner.zip ]; then rm aws-lambda-ecr-cleaner.zip; fi
	@rm -rf build/*
