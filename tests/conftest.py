"""Pytest configuration — ensure tests run in mock mode.

Forces mock_mode=True so no real LLM calls are made during tests.
"""

from config.settings import settings

# Override before any test imports agent modules
settings.mock_mode = True
settings.router_model = "mock"
settings.sales_model = "mock"
settings.extractor_model = "mock"
