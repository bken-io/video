#!/bin/bash
set -e

VIDEO_INPUT_PATH=local/file
THUMBNAIL_OUTPUT_PATH=local/thumb.webp

ffmpeg -y -i $VIDEO_INPUT_PATH -vframes 1 -ss $2 -filter:v scale='480:-1' -quality 70 $THUMBNAIL_OUTPUT_PATH

echo "Done processing thumbnail"
ls local/

aws s3 cp --endpoint "https://nyc3.digitaloceanspaces.com" $THUMBNAIL_OUTPUT_PATH s3://bken-sandbox-dev/thumb.jpg
# s3cmd put -c local/s3cfg.ini $THUMBNAIL_OUTPUT_PATH s3://bken-sandbox-dev/thumb.jpg