# ACP Shared Mock Data

This folder is the shared mock-data source for the ACP-SEA Bridge modules.

- `sellers.json` defines the common seller identities, countries, cities, and default currencies.
- `catalog.json` defines the common product catalog, compliance metadata, delivery city, COD metadata, BNPL flags, and return windows.

Member 1 maps this data into protocol-safe base payloads and SEA extension payloads.
Member 2 maps the same data into marketplace runtime sellers and SKUs, then adds runtime-only metadata such as seller rating, COD return rate, stock quantity, and buyer profiles.

The data is synthetic and local. It is not pulled from Shopee, payment gateways, lenders, or any real marketplace API.
