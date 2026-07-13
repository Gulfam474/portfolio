FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    ca-certificates \
    && wget -qO /tmp/tectonic.tar.gz \
      "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz" \
    && tar -xzf /tmp/tectonic.tar.gz -C /usr/local/bin \
    && chmod +x /usr/local/bin/tectonic \
    && rm -rf /tmp/tectonic.tar.gz /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
RUN chmod +x scripts/cloudrun_entrypoint.sh
CMD ["sh", "scripts/cloudrun_entrypoint.sh"]
