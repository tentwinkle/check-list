"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, QrCode } from "lucide-react";
import { CreateTemplateItemDialog } from "./create-template-item-dialog";
import { TemplateItemsList } from "./template-items-list";
import { QRCodeDialog } from "./qr-code-dialog";

interface TemplateItemsManagementProps {
  templateId: string;
  templateName: string;
  onUpdate: () => void;
}

export function TemplateItemsManagement({
  templateId,
  templateName,
  onUpdate,
}: TemplateItemsManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleShowQR = (item: any) => {
    setSelectedItem(item);
    setShowQRDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Template Items - {templateName}</CardTitle>
            <CardDescription>
              Manage checklist items for this inspection template
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full sm:w-auto sm:block">
            <Button
              variant="outline"
              onClick={() => setShowQRDialog(true)}
              className="w-full sm:w-auto"
            >
              <QrCode className="mr-2 h-4 w-4" />
              View QR Codes
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <TemplateItemsList
          templateId={templateId}
          refreshKey={refreshKey}
          onUpdate={() => {
            setRefreshKey((k) => k + 1);
            onUpdate();
          }}
          onShowQR={handleShowQR}
        />
      </CardContent>

      <CreateTemplateItemDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          onUpdate();
        }}
        templateId={templateId}
      />

      <QRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        templateId={templateId}
        selectedItem={selectedItem}
      />
    </Card>
  );
}
