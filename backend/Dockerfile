# Stage 1: Build IDLGuesser from source
FROM rust:1.75-slim AS idl-builder
RUN apt-get update && apt-get install -y git pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/sec3-service/IDLGuesser.git /idl
WORKDIR /idl
RUN cargo build --release

# Stage 2: Main application
FROM python:3.12-slim

WORKDIR /app

# Install supervisor and system dependencies
RUN apt-get update && apt-get install -y \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy IDLGuesser binary from builder stage
COPY --from=idl-builder /idl/target/release/idl-guesser /usr/local/bin/idl-guesser
RUN chmod +x /usr/local/bin/idl-guesser

# Install Python dependencies
COPY backend/requirements-all.txt .
RUN pip install --no-cache-dir -r requirements-all.txt

# Copy backend application code
COPY backend/ .

# Copy supervisor config
COPY backend/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Make startup script executable
RUN chmod +x /app/start.sh

# Expose the AgentOS API port
EXPOSE 7777

# Run migrations and start services
CMD ["/app/start.sh"]
