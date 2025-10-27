/**
 * 对象存储服务
 * 使用 @replit/object-storage（Replit App Storage）来存储和检索文件
 * 参考: blueprint:javascript_object_storage
 */
import { Client } from "@replit/object-storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { db } from "./db";
import { objectAclPolicies } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Replit对象存储客户端
 * 自动连接到Replit的默认bucket
 */
export const objectStorageClient = new Client();

/**
 * 对象未找到错误
 */
export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * 对象ACL策略
 * 存储在数据库中
 */
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}

/**
 * 对象权限枚举
 */
export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

/**
 * 对象存储服务类
 * 处理文件上传、下载、ACL管理等操作
 */
export class ObjectStorageService {

  constructor() {}

  /**
   * 上传文件到对象存储
   * @param buffer - 文件内容（Buffer）
   * @param contentType - 文件MIME类型
   * @returns 对象路径（格式: /objects/uploads/{uuid}）
   */
  async uploadFile(buffer: Buffer, contentType: string): Promise<string> {
    const objectId = randomUUID();
    const objectKey = `uploads/${objectId}`;
    const objectPath = `/objects/${objectKey}`;

    const result = await objectStorageClient.uploadFromBytes(objectKey, buffer);
    
    if (!result.ok) {
      throw new Error(`Failed to upload file: ${result.error.message}`);
    }

    return objectPath;
  }

  /**
   * 上传文本到对象存储
   * @param text - 文本内容
   * @param extension - 文件扩展名（可选）
   * @returns 对象路径
   */
  async uploadText(text: string, extension: string = 'txt'): Promise<string> {
    const objectId = randomUUID();
    const objectKey = `uploads/${objectId}.${extension}`;
    const objectPath = `/objects/${objectKey}`;

    const result = await objectStorageClient.uploadFromText(objectKey, text);
    
    if (!result.ok) {
      throw new Error(`Failed to upload text: ${result.error.message}`);
    }

    return objectPath;
  }

  /**
   * 下载对象文件到HTTP响应
   * @param objectPath - 对象路径（格式: /objects/...）
   * @param res - Express响应对象
   * @param cacheTtlSec - 缓存TTL（秒）
   */
  async downloadObject(objectPath: string, res: Response, cacheTtlSec: number = 3600) {
    try {
      // 从路径提取objectKey
      if (!objectPath.startsWith("/objects/")) {
        throw new ObjectNotFoundError();
      }
      const objectKey = objectPath.slice("/objects/".length);

      // 获取ACL策略
      const aclPolicy = await this.getObjectAclPolicy(objectPath);
      const isPublic = aclPolicy?.visibility === "public";

      // 下载文件为stream（直接await，返回Readable）
      const stream = await objectStorageClient.downloadAsStream(objectKey);

      // 设置响应头
      res.set({
        "Content-Type": "application/octet-stream", // 可以根据文件扩展名优化
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      // Stream文件到响应
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
      throw error;
    }
  }

  /**
   * 设置对象的ACL策略
   * @param objectPath - 对象路径（格式: /objects/...）
   * @param aclPolicy - ACL策略
   */
  async setObjectAclPolicy(objectPath: string, aclPolicy: ObjectAclPolicy): Promise<void> {
    // 验证对象路径格式
    if (!objectPath.startsWith("/objects/")) {
      throw new Error("Invalid object path");
    }

    // 使用upsert（插入或更新）
    await db
      .insert(objectAclPolicies)
      .values({
        objectPath,
        owner: aclPolicy.owner,
        visibility: aclPolicy.visibility,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: objectAclPolicies.objectPath,
        set: {
          owner: aclPolicy.owner,
          visibility: aclPolicy.visibility,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * 获取对象的ACL策略
   * @param objectPath - 对象路径
   */
  async getObjectAclPolicy(objectPath: string): Promise<ObjectAclPolicy | null> {
    const result = await db
      .select()
      .from(objectAclPolicies)
      .where(eq(objectAclPolicies.objectPath, objectPath))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      owner: result[0].owner,
      visibility: result[0].visibility as "public" | "private",
    };
  }

  /**
   * 检查用户是否可以访问对象
   * @param userId - 用户ID
   * @param objectPath - 对象路径
   * @param requestedPermission - 请求的权限
   */
  async canAccessObject({
    userId,
    objectPath,
    requestedPermission,
  }: {
    userId?: string;
    objectPath: string;
    requestedPermission: ObjectPermission;
  }): Promise<boolean> {
    const aclPolicy = await this.getObjectAclPolicy(objectPath);
    if (!aclPolicy) {
      return false;
    }

    // 公开对象允许读取
    if (
      aclPolicy.visibility === "public" &&
      requestedPermission === ObjectPermission.READ
    ) {
      return true;
    }

    // 访问控制需要用户ID
    if (!userId) {
      return false;
    }

    // 对象所有者总是可以访问
    if (aclPolicy.owner === userId) {
      return true;
    }

    return false;
  }

  /**
   * 删除对象
   * @param objectPath - 对象路径
   */
  async deleteObject(objectPath: string): Promise<void> {
    if (!objectPath.startsWith("/objects/")) {
      throw new Error("Invalid object path");
    }
    const objectKey = objectPath.slice("/objects/".length);

    const result = await objectStorageClient.delete(objectKey);
    
    if (!result.ok) {
      throw new Error(`Failed to delete file: ${result.error.message}`);
    }

    // 删除ACL策略
    await db.delete(objectAclPolicies).where(eq(objectAclPolicies.objectPath, objectPath));
  }

  /**
   * 复制对象
   * @param sourcePath - 源对象路径
   * @param destPath - 目标对象路径
   */
  async copyObject(sourcePath: string, destPath: string): Promise<void> {
    if (!sourcePath.startsWith("/objects/") || !destPath.startsWith("/objects/")) {
      throw new Error("Invalid object path");
    }
    
    const sourceKey = sourcePath.slice("/objects/".length);
    const destKey = destPath.slice("/objects/".length);

    const result = await objectStorageClient.copy(sourceKey, destKey);
    
    if (!result.ok) {
      throw new Error(`Failed to copy file: ${result.error.message}`);
    }

    // 复制ACL策略
    const aclPolicy = await this.getObjectAclPolicy(sourcePath);
    if (aclPolicy) {
      await this.setObjectAclPolicy(destPath, aclPolicy);
    }
  }

  /**
   * 列出所有对象
   * @returns 对象路径数组
   */
  async listObjects(): Promise<string[]> {
    const result = await objectStorageClient.list();
    
    if (!result.ok) {
      throw new Error(`Failed to list objects: ${result.error.message}`);
    }

    return result.value.map(item => `/objects/${item.key}`);
  }
}
