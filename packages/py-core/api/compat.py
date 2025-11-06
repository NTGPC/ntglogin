"""
Compatibility layer to ensure exact match with Node.js API contract.
Add any response transformations here if needed.
"""
from fastapi import FastAPI


def setup_compat(app: FastAPI):
    """Setup compatibility adapters if needed."""
    # Currently no transformations needed, but this is where we'd add
    # any field name mappings or response shape changes to match Node.js exactly
    pass

