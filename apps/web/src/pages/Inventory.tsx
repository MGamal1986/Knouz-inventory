import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Badge } from "../components/ui/Badge";
import { Input, Select } from "../components/ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { ProductFormModal, EditableProduct } from "../components/ProductFormModal";
import { downloadCsv } from "../utils/csv";

interface Category {
  id: number;
  name: string;
  baseCode: string;
}
interface Supplier {
  id: number;
  name: string;
}
interface InventoryItem {
  id: number;
  productCode: string;
  description: string;
  categoryId: number;
  category: { name: string };
  supplierId: number;
  supplier: { name: string };
  purchaseDate: string;
  originalCost: string;
  profitPercent: string;
  sellingPrice: string;
  quantity: number;
  quantitySold: number;
  stock: number;
}

function stockBadge(stock: number) {
  if (stock <= 0) return <Badge tone="error">Sold Out</Badge>;
  if (stock <= 2) return <Badge tone="warning">Low Stock ({stock})</Badge>;
  return <Badge tone="success">In Stock ({stock})</Badge>;
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);

  function loadInventory(searchValue = search, categoryValue = categoryId) {
    api
      .get("/api/inventory", {
        params: {
          ...(searchValue ? { search: searchValue } : {}),
          ...(categoryValue ? { categoryId: categoryValue } : {}),
        },
      })
      .then((res) => setItems(res.data));
  }

  function loadLookups() {
    api.get("/api/categories").then((res) => setCategories(res.data));
    api.get("/api/suppliers").then((res) => setSuppliers(res.data));
  }

  useEffect(() => {
    loadInventory();
    loadLookups();
  }, []);

  async function onDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/api/products/${id}`);
    loadInventory();
  }

  function openAddModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(item: InventoryItem) {
    setEditingProduct({
      id: item.id,
      description: item.description,
      categoryId: item.categoryId,
      supplierId: item.supplierId,
      purchaseDate: item.purchaseDate,
      originalCost: item.originalCost,
      profitPercent: item.profitPercent,
      quantity: item.quantity,
    });
    setModalOpen(true);
  }

  function onSaved() {
    setModalOpen(false);
    setEditingProduct(null);
    loadInventory();
  }

  function onExport() {
    downloadCsv(
      "inventory.csv",
      [
        "Product Code",
        "Description",
        "Category",
        "Supplier",
        "Cost",
        "Selling Price",
        "Quantity Purchased",
        "Quantity Sold",
        "Stock",
      ],
      items.map((item) => [
        item.productCode,
        item.description,
        item.category.name,
        item.supplier.name,
        Number(item.originalCost).toFixed(2),
        Number(item.sellingPrice).toFixed(2),
        item.quantity,
        item.quantitySold,
        item.stock,
      ])
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary mb-xs">Inventory</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Manage and track all jewelry products and stock levels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              loadInventory(e.target.value, categoryId);
            }}
            placeholder="Search by code or description..."
            className="w-64"
          />
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              loadInventory(search, e.target.value);
            }}
            className="w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button variant="ghost" onClick={onExport}>
            <Icon name="download" className="text-[18px]" />
            Export CSV
          </Button>
          <Button onClick={openAddModal}>
            <Icon name="add" />
            Add Product
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <Thead>
            <tr>
              <Th>Product Code</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Supplier</Th>
              <Th className="text-right">Cost</Th>
              <Th className="text-right">Selling Price</Th>
              <Th className="text-center">Stock Level</Th>
              <Th className="w-10" />
            </tr>
          </Thead>
          <Tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td className="text-code-label font-code-label text-primary">{item.productCode}</Td>
                <Td className="font-medium text-primary">{item.description}</Td>
                <Td className="text-on-surface-variant">{item.category.name}</Td>
                <Td className="text-on-surface-variant">{item.supplier.name}</Td>
                <Td className="text-right text-on-surface-variant">{Number(item.originalCost).toFixed(2)}</Td>
                <Td className="text-right font-medium">{Number(item.sellingPrice).toFixed(2)}</Td>
                <Td className="text-center">{stockBadge(item.stock)}</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-sm">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="text-on-surface-variant hover:text-primary"
                      aria-label="Edit product"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="text-on-surface-variant hover:text-error"
                      aria-label="Delete product"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <div className="px-lg py-md border-t border-surface-border text-body-sm text-on-surface-variant">
          Showing {items.length} product{items.length === 1 ? "" : "s"}
        </div>
      </Card>

      {modalOpen && (
        <ProductFormModal
          categories={categories}
          suppliers={suppliers}
          editingProduct={editingProduct}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
