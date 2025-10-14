import os
import requests

SIENGE_BASE_URL = os.getenv("SIENGE_BASE_URL", "https://api.sienge.com.br")
SIENGE_USER = os.getenv("SIENGE_USER")
SIENGE_PASS = os.getenv("SIENGE_PASS")

def get_token():
    # NOTE: Replace this endpoint with the real auth endpoint for your Sienge installation.
    auth_url = f"{SIENGE_BASE_URL}/auth"
    if not SIENGE_USER or not SIENGE_PASS:
        raise Exception("SIENGE_USER or SIENGE_PASS not set in environment")
    resp = requests.post(auth_url, auth=(SIENGE_USER, SIENGE_PASS), timeout=10)
    resp.raise_for_status()
    j = resp.json()
    # adjust extracting token according to Sienge response schema
    return j.get('access_token') or j.get('token') or j.get('accessToken')

def request_with_token(path: str, params: dict | None = None):
    token = get_token()
    url = f"{SIENGE_BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    r = requests.get(url, headers=headers, params=params or {}, timeout=15)
    r.raise_for_status()
    return r.json()

def get_contas_a_pagar(empresa: str | None = None):
    # Endpoint path needs to match the Sienge API you're using; adjust if necessary.
    params = {}
    if empresa:
        params['empresa'] = empresa
    return request_with_token("/accounts-payable/bills", params)

def get_extrato_cliente(empresa: str | None = None):
    params = {}
    if empresa:
        params['empresa'] = empresa
    return request_with_token("/customer-financial-statements", params)
