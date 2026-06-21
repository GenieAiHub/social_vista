# Caddy with the Cloudflare DNS plugin so it can solve the ACME DNS-01 challenge.
# DNS-01 is used (instead of HTTP-01/TLS-ALPN-01) because the domain sits behind
# Cloudflare's proxy (orange cloud) with SSL mode "Full (strict)": Caddy obtains a
# publicly-trusted Let's Encrypt cert for the origin, which Cloudflare then trusts.
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/cloudflare

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
