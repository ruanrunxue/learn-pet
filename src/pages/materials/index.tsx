import {
  View,
  Text,
  Input,
  Button,
  Checkbox,
  CheckboxGroup,
} from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { request } from "../../utils/api";
import TabBar from "../../components/TabBar";
import "./index.scss";

interface Material {
  id: number;
  teacherId: number;
  name: string;
  fileType: string;
  fileExtension: string;
  fileUrl: string;
  tags: string[];
  createdAt: string;
}

/**
 * 学习资料管理页面
 * 表格形式展示，支持搜索、筛选、排序、分页、批量删除
 */
export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // 选择相关
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 搜索筛选
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // 排序
  const [sortField, setSortField] = useState<"id" | "name" | "fileExtension">(
    "id",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const role = Taro.getStorageSync("userRole");
    setUserRole(role);
    loadMaterials();
  }, []);

  useEffect(() => {
    // 应用搜索、筛选、排序
    let result = [...materials];

    // 搜索
    if (searchKeyword) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          m.id.toString().includes(searchKeyword),
      );
    }

    // 标签筛选
    if (filterTag) {
      result = result.filter((m) =>
        m.tags.some((tag) =>
          tag.toLowerCase().includes(filterTag.toLowerCase()),
        ),
      );
    }

    // 排序
    result.sort((a, b) => {
      let compareValue = 0;
      if (sortField === "id") {
        compareValue = a.id - b.id;
      } else if (sortField === "name") {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortField === "fileExtension") {
        compareValue = a.fileExtension.localeCompare(b.fileExtension);
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredMaterials(result);
    setTotalPages(Math.ceil(result.length / pageSize));
    setCurrentPage(1);
  }, [materials, searchKeyword, filterTag, sortField, sortOrder, pageSize]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await request<Material[]>({
        url: "/materials",
        method: "GET",
      });
      setMaterials(data);
    } catch (error) {
      Taro.showToast({
        title: "加载失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取当前页数据
  const getCurrentPageData = () => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredMaterials.slice(start, end);
  };

  // 处理全选
  const handleSelectAll = (e: any) => {
    const values = e.detail.value as string[];
    const checked = values.length > 0;
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(getCurrentPageData().map((m) => m.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 处理单选
  const handleSelectItem = (id: number, e: any) => {
    const values = e.detail.value as string[];
    const checked = values.includes(id.toString());
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
      setSelectAll(false);
    }
    setSelectedIds(newSelectedIds);
  };

  // 处理排序
  const handleSort = (field: "id" | "name" | "fileExtension") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // 处理行点击
  const handleRowClick = (material: Material) => {
    console.log(selectedIds);
    Taro.navigateTo({
      url: `/pages/material-detail/index?id=${material.id}`,
    });
  };

  // 上传资料
  const handleUpload = () => {
    Taro.navigateTo({
      url: "/pages/material-upload/index",
    });
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      Taro.showToast({ title: "请选择要删除的资料", icon: "none" });
      return;
    }

    const confirmed = await Taro.showModal({
      title: "确认删除",
      content: `确定要删除选中的 ${selectedIds.size} 条资料吗？此操作不可恢复。`,
    });

    if (!confirmed.confirm) return;

    try {
      await request({
        url: "/materials/batch/delete",
        method: "DELETE",
        data: { ids: Array.from(selectedIds) },
      });

      Taro.showToast({ title: "删除成功", icon: "success" });
      setSelectedIds(new Set());
      setSelectAll(false);
      loadMaterials();
    } catch (error: any) {
      Taro.showToast({
        title: error.message || "删除失败",
        icon: "none",
      });
    }
  };

  return (
    <View className="materials-container">
      <View className="page-content">
        {/* 标题和操作按钮 */}
        <View className="header">
          <Text className="title">学习资料管理</Text>
          {userRole === "teacher" && (
            <View className="action-buttons">
              <Button
                className="delete-btn"
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
              >
                删除 ({selectedIds.size})
              </Button>
              <Button
                className="upload-btn"
                type="primary"
                onClick={handleUpload}
              >
                上传资料
              </Button>
            </View>
          )}
        </View>

        {/* 搜索和筛选 */}
        <View className="filters">
          <Input
            className="search-input"
            placeholder="搜索资料ID或名称..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
          <Input
            className="filter-input"
            placeholder="按标签筛选..."
            value={filterTag}
            onInput={(e) => setFilterTag(e.detail.value)}
          />
        </View>

        {loading ? (
          <View className="loading">加载中...</View>
        ) : filteredMaterials.length === 0 ? (
          <View className="empty">
            <Text>暂无学习资料</Text>
          </View>
        ) : (
          <>
            {/* 表格 */}
            <View className="table-container">
              <View className="table">
                {/* 表头 */}
                <View className="table-header">
                  {userRole === "teacher" && (
                    <View className="table-cell checkbox-cell">
                      <CheckboxGroup onChange={handleSelectAll}>
                        <Checkbox value="all" checked={selectAll} />
                      </CheckboxGroup>
                    </View>
                  )}
                  <View
                    className="table-cell name-cell"
                    onClick={() => handleSort("name")}
                  >
                    <Text>
                      资料名{" "}
                      {sortField === "name" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </Text>
                  </View>
                  <View
                    className="table-cell type-cell"
                    onClick={() => handleSort("fileExtension")}
                  >
                    <Text>
                      类型{" "}
                      {sortField === "fileExtension" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </Text>
                  </View>
                  <View className="table-cell tags-cell">
                    <Text>标签</Text>
                  </View>
                </View>

                {/* 表体 */}
                {getCurrentPageData().map((material) => (
                  <View
                    key={material.id}
                    className={`table-row ${selectedIds.has(material.id) ? "selected" : ""}`}
                  >
                    {userRole === "teacher" && (
                      <View
                        className="table-cell checkbox-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CheckboxGroup
                          onChange={(e) => handleSelectItem(material.id, e)}
                        >
                          <Checkbox
                            value={material.id.toString()}
                            checked={selectedIds.has(material.id)}
                          />
                        </CheckboxGroup>
                      </View>
                    )}
                    <View
                      className="table-cell name-cell"
                      onClick={() => handleRowClick(material)}
                    >
                      <Text className="material-name-text">
                        {material.name}
                      </Text>
                    </View>
                    <View
                      className="table-cell type-cell"
                      onClick={() => handleRowClick(material)}
                    >
                      <Text className="file-extension">
                        {material.fileExtension || "-"}
                      </Text>
                    </View>
                    <View
                      className="table-cell tags-cell"
                      onClick={() => handleRowClick(material)}
                    >
                      <View className="tags">
                        {material.tags && material.tags.length > 0 ? (
                          material.tags.map((tag, index) => (
                            <Text key={index} className="tag">
                              {tag}
                            </Text>
                          ))
                        ) : (
                          <Text className="no-tags">无</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 分页控制 */}
            <View className="pagination">
              <View className="page-size-selector">
                <Text>每页显示：</Text>
                <View className="size-options">
                  {[10, 20, 50, 100].map((size) => (
                    <Text
                      key={size}
                      className={`size-option ${pageSize === size ? "active" : ""}`}
                      onClick={() => setPageSize(size)}
                    >
                      {size}
                    </Text>
                  ))}
                </View>
              </View>

              <View className="page-controls">
                <Button
                  className="page-btn"
                  size="mini"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  上一页
                </Button>
                <Text className="page-info">
                  {currentPage} / {totalPages}
                </Text>
                <Button
                  className="page-btn"
                  size="mini"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                </Button>
              </View>

              <Text className="total-info">
                共 {filteredMaterials.length} 条记录
              </Text>
            </View>
          </>
        )}
      </View>

      <TabBar current="/pages/materials/index" />
    </View>
  );
}
