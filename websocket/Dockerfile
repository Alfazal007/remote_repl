FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache curl build-base git bash

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Bun globally via npm
RUN npm install -g bun

# Clone the repository
RUN git clone --filter=blob:none --sparse https://github.com/Alfazal007/remote_repl.git /app && \
    cd /app && \
    git sparse-checkout set websocket && \
    mv websocket/* . && \
    rm -rf websocket .git

WORKDIR /app

# Install dependencies with bun
RUN bun install

CMD ["/bin/bash"]
