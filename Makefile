# =============================================================================
# DyingStar Resources Dynamic Service - Makefile
# =============================================================================

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

EXECUTOR := docker compose

# if podman is available, use it instead of docker
ifneq (, $(shell which podman 2>/dev/null))
$(info ❗❗ Using podman for compose commands❗❗)
EXECUTOR := podman compose
endif

# Get absolute path to project root
ROOT_DIR := $(shell pwd)
COMPOSE := $(EXECUTOR) -f $(ROOT_DIR)/docker/docker-compose.yml --env-file $(ROOT_DIR)/.env

DEV_SERVICE := dev
APP_SERVICE := app


# =============================================================================
# Check .env file exists
# =============================================================================
.PHONY: check-env
check-env:
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ .env file not found!$(RESET)"; \
		echo "$(YELLOW)💡 Copy .env.sample to .env and configure it:$(RESET)"; \
		echo "   cp .env.sample .env"; \
		exit 1; \
	fi

.PHONY: stop
stop: ## Stop all running services
	@echo "$(CYAN)🛑 Stopping all services...$(RESET)"
	@$(COMPOSE) down

# =============================================================================
# Dev Profile - Development commands
# =============================================================================

.PHONY: up
up: check-env ## Start only dev for development (no app)
	@echo "$(CYAN)🔧 Starting development environment...$(RESET)"
	@$(COMPOSE) up $(DEV_SERVICE) -d
	@echo "$(GREEN)✅ Development environment ready!$(RESET)"
	@echo "$(YELLOW)Use 'make pnpm <command>' to run pnpm commands$(RESET)"

.PHONY: down
down: ## Stop development environment
	@echo "$(CYAN)🛑 Stopping development environment...$(RESET)"
	@$(COMPOSE) down

# Generic pnpm command runner
.PHONY: pnpm
pnpm: check-env ## Run any pnpm command (usage: make pnpm install, make pnpm dev, etc.)
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "$(RED)❌ Please provide a pnpm command. Usage: make pnpm <command>$(RESET)"; \
		echo "$(YELLOW)Examples: make pnpm install, make pnpm dev, make pnpm build$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)📦 Running: pnpm $(filter-out $@,$(MAKECMDGOALS))$(RESET)"
	@$(COMPOSE) exec $(DEV_SERVICE) sh -c "corepack enable && corepack install && pnpm $(filter-out $@,$(MAKECMDGOALS))"

# =============================================================================
# Utility commands
# =============================================================================

.PHONY: logs
logs: ## Show logs for all services
	@$(COMPOSE) logs -f

.PHONY: logs-dev
logs-dev: ## Show logs for dev service only
	@$(COMPOSE) logs -f $(DEV_SERVICE)

.PHONY: shell
shell: ## Open shell in dev container
	@echo "$(CYAN)🐚 Opening shell in dev container...$(RESET)"
	@$(COMPOSE) exec $(DEV_SERVICE) sh

.PHONY: status
status: ## Show status of all services
	@echo "$(CYAN)📊 Service Status:$(RESET)"
	@$(COMPOSE) ps

.PHONY: clean-volumes
clean-volumes: ## Remove all volumes (WARNING: This will delete all data!)
	@echo "$(RED)⚠️  This will delete all Docker volumes and data!$(RESET)"
	@read -p "Are you sure? (y/N) " answer; \
	if [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
		$(COMPOSE) down -v; \
		echo "$(GREEN)✅ Volumes cleaned$(RESET)"; \
	else \
		echo "$(YELLOW)Cancelled$(RESET)"; \
	fi

# =============================================================================
# Help
# =============================================================================

.PHONY: help
help: ## Show this help message
	@echo "$(CYAN)DyingStar Resources Dynamic - Available Commands:$(RESET)"
	@echo ""
	@echo "$(YELLOW)CP/PO/Others Profile (Simple Testing):$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(start|stop)"
	@echo ""
	@echo "$(YELLOW)Dev Profile (Development):$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(up|down|pnpm)"
	@echo ""
	@echo "$(YELLOW)Utilities:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(logs|shell|status|clean-volumes|db)"
	@echo ""
	@echo "$(YELLOW)Examples:$(RESET)"
	@echo "  $(CYAN)make up$(RESET)             # Start dev environment (Dev)"
	@echo "  $(CYAN)make pnpm dev$(RESET)       # Start dev server"
	@echo "  $(CYAN)make pnpm build$(RESET)     # Build the application"
	@echo "  $(CYAN)make install$(RESET)        # Install dependencies"

# Default target
.DEFAULT_GOAL := help

# Allow arguments to be passed to make commands
%:
	@: