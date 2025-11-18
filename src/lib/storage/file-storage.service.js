const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} = require('@aws-sdk/client-s3')
const fs = require('fs').promises
const path = require('path')

class FileStorageService {
  constructor({ logger }) {
    this.logger = logger
    this.storageType = process.env.STORAGE_TYPE || 'minio'
    this.minioClient = null
    this.bucketInitialized = false

    if (this.storageType === 'minio') {
      this.minioClient = new S3Client({
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        region: 'us-east-1', // MinIO doesn't care about region, but SDK requires it
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
        },
        forcePathStyle: true, // Required for MinIO
        requestTimeout: 30000 // 30 second timeout
      })
      this.bucket = process.env.MINIO_BUCKET || 'photos'
    } else {
      // Local file system storage
      this.uploadDir = process.env.UPLOAD_DIR || 'uploads/photos'
    }
  }

  async _ensureBucketExists() {
    if (this.storageType !== 'minio' || this.bucketInitialized) {
      return
    }

    try {
      // Check if bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: this.bucket })
      await this.minioClient.send(headCommand)
      this.bucketInitialized = true
      this.logger.info({ bucket: this.bucket }, 'MinIO bucket exists')
    } catch (error) {
      // Bucket doesn't exist, create it
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        try {
          const createCommand = new CreateBucketCommand({ Bucket: this.bucket })
          await this.minioClient.send(createCommand)
          this.bucketInitialized = true
          this.logger.info({ bucket: this.bucket }, 'Created MinIO bucket')
        } catch (createError) {
          this.logger.error(
            { err: createError, bucket: this.bucket },
            'Failed to create MinIO bucket'
          )
          throw new Error(
            `Failed to create MinIO bucket '${this.bucket}': ${createError.message}`
          )
        }
      } else {
        // Other error (permissions, network, etc.)
        this.logger.error(
          { err: error, bucket: this.bucket },
          'Failed to check MinIO bucket existence'
        )
        throw new Error(
          `Failed to access MinIO bucket '${this.bucket}': ${error.message}`
        )
      }
    }
  }

  async saveFile({ file }) {
    try {
      const filename = file.originalname || 'file'
      if (this.storageType === 'minio') {
        return await this._saveToMinIO({ file, filename })
      } else {
        return await this._saveToLocal({ file, filename })
      }
    } catch (error) {
      this.logger.error(
        { err: error, filename: file.originalname },
        'Failed to save file'
      )
      throw error
    }
  }

  async deleteFile({ url }) {
    try {
      if (this.storageType === 'minio') {
        await this._deleteFromMinIO({ url })
      } else {
        await this._deleteFromLocal({ url })
      }
    } catch (error) {
      // Log error but don't throw - file deletion is best-effort
      this.logger.warn(
        { err: error, url },
        'Failed to delete file (best-effort)'
      )
    }
  }

  async _saveToMinIO({ file, filename }) {
    // Ensure bucket exists before saving
    await this._ensureBucketExists()

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype
    })

    await this.minioClient.send(command)

    // Construct public URL
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
    const publicUrl = `${endpoint}/${this.bucket}/${filename}`

    return publicUrl
  }

  async _saveToLocal({ file, filename }) {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true })

    const filePath = path.join(this.uploadDir, filename)
    await fs.writeFile(filePath, file.buffer)

    // Return relative URL or full URL based on configuration
    const baseUrl = process.env.UPLOAD_BASE_URL || '/uploads/photos'
    return `${baseUrl}/${filename}`
  }

  async _deleteFromMinIO({ url }) {
    // Extract key from URL
    const urlParts = url.split('/')
    const key = urlParts[urlParts.length - 1]

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    })

    await this.minioClient.send(command)
  }

  async _deleteFromLocal({ url }) {
    // Extract filename from URL
    const urlParts = url.split('/')
    const filename = urlParts[urlParts.length - 1]
    const filePath = path.join(this.uploadDir, filename)

    await fs.unlink(filePath)
  }
}

module.exports = FileStorageService
