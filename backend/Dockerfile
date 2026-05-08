FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostgreSQL and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set environment variables for Cloud Run compatibility
ENV PORT=8080
EXPOSE 8080

# Run the application using uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
