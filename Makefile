.PHONY: install build run test clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make build      - Compile TypeScript to JavaScript"
	@echo "  make run        - Run the application (requires build)"
	@echo "  make test       - Run all tests"
	@echo "  make clean      - Remove build artifacts and database"

install:
	npm install

build:
	npm run build

run:
	npm start

test:
	npm test

clean:
	rm -rf dist
	rm -f vibe-pm.sqlite
	rm -rf coverage

