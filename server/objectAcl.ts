/**
 * 对象访问控制列表(ACL)管理
 * 管理对象的所有权和访问权限
 * 参考: blueprint:javascript_object_storage
 */
import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

/**
 * 对象权限枚举
 */
export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

/**
 * 对象ACL策略
 * 存储在对象元数据中
 */
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}

/**
 * 检查请求的权限是否被允许
 */
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

/**
 * 设置对象的ACL策略到元数据
 * @param objectFile - Google Cloud Storage文件对象
 * @param aclPolicy - ACL策略
 */
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

/**
 * 从对象元数据获取ACL策略
 * @param objectFile - Google Cloud Storage文件对象
 */
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

/**
 * 检查用户是否可以访问对象
 * @param userId - 用户ID（字符串形式）
 * @param objectFile - Google Cloud Storage文件对象
 * @param requestedPermission - 请求的权限
 */
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
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
