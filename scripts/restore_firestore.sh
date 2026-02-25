#!/bin/bash

# Sakhipur Bazar - Firestore Restore Script
# This script imports Firestore data from a Google Cloud Storage bucket.

if [ -z "$1" ]; then
    echo "Usage: ./restore_firestore.sh <backup_folder_name>"
    echo "Example: ./restore_firestore.sh firestore_export_20251219_001000"
    exit 1
fi

# Configuration
BUCKET_NAME="sakhipur-bazar-backups" # Replace with your actual bucket name
BACKUP_NAME=$1
BACKUP_PATH="gs://${BUCKET_NAME}/${BACKUP_NAME}"

echo "CAUTION: This will overwrite existing data. Are you sure? (y/n)"
read confirm
if [ "$confirm" != "y" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Starting Firestore restore from ${BACKUP_PATH}..."

# Run import
gcloud firestore import ${BACKUP_PATH}

if [ $? -eq 0 ]; then
    echo "Restore completed successfully."
else
    echo "Restore failed. Please check the logs."
    exit 1
fi
