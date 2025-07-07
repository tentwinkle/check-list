"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  QrCode,
  MoveUp,
  MoveDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { EditTemplateItemDialog } from "./edit-template-item-dialog";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  location?: string;
  qrCodeId: string;
  order: number;
}

interface TemplateItemsListProps {
  templateId: string;
  refreshKey: number;
  onUpdate: () => void;
  onShowQR: (item: TemplateItem) => void;
  organizationId?: string;
}

export function TemplateItemsList({
  templateId,
  refreshKey,
  onUpdate,
  onShowQR,
  organizationId,
}: TemplateItemsListProps) {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [templateId, refreshKey]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/template-items?templateId=${templateId}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load template items",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch template items:", error);
      toast({
        title: "Error",
        description: "Failed to load template items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (itemId: string, direction: "up" | "down") => {
    setLoadingItem(itemId);
    try {
      const response = await fetch(`/api/admin/template-items/${itemId}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        await fetchItems();
        onUpdate();
      } else {
        toast({
          title: "Error",
          description: "Failed to reorder item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingItem(null);
    }
  };

  const handleEdit = (item: TemplateItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = async (itemId: string) => {
    setLoadingItem(itemId);
    try {
      const response = await fetch(`/api/admin/template-items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template item deleted successfully.",
        });
        await fetchItems();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete template item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingItem(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading template items...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No template items found. Add your first checklist item to get started.
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Order</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>QR Code</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{item.order}</span>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleReorder(item.id, "up")}
                    disabled={index === 0 || loadingItem === item.id}
                  >
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleReorder(item.id, "down")}
                    disabled={index === sortedItems.length - 1 || loadingItem === item.id}
                  >
                    <MoveDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.description || "-"}</TableCell>
            <TableCell>{item.location || "-"}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowQR(item)}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{item.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={loadingItem === item.id}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <EditTemplateItemDialog
      open={showEditDialog}
      onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setEditingItem(null);
      }}
      templateId={templateId}
      item={editingItem}
      onSuccess={() => {
        fetchItems();
        onUpdate();
      }}
      organizationId={organizationId}
    />
  );
}
