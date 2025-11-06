"""
Tests for fingerprint injection module.
"""
from services.fingerprint_injection import build_injection, get_default_fingerprint


def test_build_injection():
    """Test building injection script from fingerprint."""
    fp = {
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "screen_width": 1920,
        "screen_height": 1080,
        "device_memory": 8,
        "hardware_concurrency": 8,
    }
    
    script = build_injection(fp)
    
    assert isinstance(script, str)
    assert len(script) > 0
    assert "webdriver" in script.lower()
    assert "userAgent" in script or "user_agent" in script.lower()


def test_get_default_fingerprint():
    """Test getting default fingerprint."""
    fp = get_default_fingerprint()
    
    assert isinstance(fp, dict)
    assert "user_agent" in fp
    assert "screen_width" in fp
    assert "screen_height" in fp


def test_injection_with_canvas():
    """Test injection with canvas hash."""
    fp = {
        "user_agent": "Mozilla/5.0...",
        "canvas": "test_hash_123",
        "webgl_vendor": "Intel Inc.",
        "webgl_renderer": "Intel Iris",
    }
    
    script = build_injection(fp)
    
    assert "canvas" in script.lower() or "Canvas" in script
    assert "webgl" in script.lower() or "WebGL" in script


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

