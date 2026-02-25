#!/bin/bash

# Sakhipur Bazar - Firestore Backup Script
# This script exports Firestore data to a Google Cloud Storage bucket.

# Configuration
BUCKET_NAME="sakhipur-bazar-backups" # Replace with your actual bucket name
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="gs://${BUCKET_NAME}/firestore_export_${TIMESTAMP}"

echo "Starting Firestore backup to ${BACKUP_PATH}..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
    echo "Error: gcloud not authenticated. Please run 'gcloud auth login'."
    exit 1
fi

# Set project
PROJECT_ID=$(gcloud config get-value project)
echo "Using Project ID: ${PROJECT_ID}"

# Run export
gcloud firestore export ${BACKUP_PATH}

if [ $? -eq 0 ]; then
    echo "Backup completed successfully at ${BACKUP_PATH}"
else
    echo "Backup failed. Please check the logs."
    exit 1
fi
