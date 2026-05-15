/**
 * ERP Responsive Implementation Example
 * Shows how to convert existing components to mobile-responsive ERP style
 */

import React, { useState } from "react";
import { useResponsive, useIsMobile } from "@/hooks/useResponsive";
import {
  ResponsiveLayout,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveSection,
} from "@/components/layout/ResponsiveComponents";
import {
  Button,
  Input,
  Alert,
  Badge,
  StatCard,
  ProgressBar,
} from "@/components/ui/ERPComponents";
import {
  AdvancedDataTable,
  Modal,
  Tabs,
} from "@/components/ui/AdvancedComponents";
import { Users, TrendingUp, Activity, Settings } from "react-icons/fa";

/**
 * Example 1: Responsive Dashboard
 */
export const ResponsiveDashboard = () => {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <ResponsiveGrid cols={{ mobile: 1, sm: 2, md: 3, lg: 4 }} gap="gap-4">
        <StatCard
          title="Total Users"
          value="1,234"
          icon={Users}
          color="purple"
          change={{ positive: true, value: "12%", label: "vs last month" }}
        />
        <StatCard
          title="Revenue"
          value="$45,231"
          icon={TrendingUp}
          color="blue"
          change={{ positive: true, value: "8%", label: "vs last month" }}
        />
        <StatCard
          title="Active Sessions"
          value="342"
          icon={Activity}
          color="green"
          change={{ positive: false, value: "5%", label: "vs last month" }}
        />
        <StatCard
          title="Settings"
          value="Updated"
          icon={Settings}
          color="blue"
        />
      </ResponsiveGrid>

      {/* Progress Section */}
      <ResponsiveSection title="Project Progress" className="mt-8">
        <div className="space-y-6">
          <ProgressBar value={85} label="Mobile App" />
          <ProgressBar value={60} label="API Development" color="blue" />
          <ProgressBar value={90} label="Documentation" color="green" />
        </div>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

/**
 * Example 2: Responsive Data Management Table
 */
export const ResponsiveDataTable = () => {
  const [editingRow, setEditingRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tableData = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "Active",
      role: "Admin",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "Pending",
      role: "Editor",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      status: "Active",
      role: "Viewer",
    },
  ];

  return (
    <ResponsiveContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Users</h2>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Add User
        </Button>
      </div>

      <AdvancedDataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          {
            key: "status",
            label: "Status",
            render: (val) => (
              <Badge variant={val === "Active" ? "success" : "warning"}>
                {val}
              </Badge>
            ),
          },
        ]}
        data={tableData}
        selectable
        sortable
        filterable
        exportable
        pagination
        pageSize={10}
        onEdit={(row) => setEditingRow(row)}
        onDelete={(row) => console.log("Delete", row)}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={editingRow !== null}
        onClose={() => setEditingRow(null)}
        title="Edit User"
        size="md"
        footer={[
          <Button
            key="cancel"
            variant="outline"
            onClick={() => setEditingRow(null)}
          >
            Cancel
          </Button>,
          <Button key="save" variant="primary">
            Save Changes
          </Button>,
        ]}
      >
        {editingRow && (
          <div className="space-y-4">
            <Input label="Name" defaultValue={editingRow.name} />
            <Input label="Email" type="email" defaultValue={editingRow.email} />
            <Input label="Role" defaultValue={editingRow.role} />
          </div>
        )}
      </Modal>
    </ResponsiveContainer>
  );
};

/**
 * Example 3: Responsive Form with Validation
 */
export const ResponsiveForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    category: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        category: "",
        message: "",
      });
    }
  };

  return (
    <ResponsiveContainer>
      <ResponsiveCard>
        <h2 className="mb-6 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          Create New Item
        </h2>

        {submitted && (
          <Alert
            type="success"
            title="Success!"
            message="Form submitted successfully"
            onClose={() => setSubmitted(false)}
            closeable
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two Column Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              placeholder="Enter first name"
              error={errors.firstName}
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              label="Last Name"
              placeholder="Enter last name"
              error={errors.lastName}
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          {/* Full Width */}
          <Input
            label="Email"
            type="email"
            placeholder="Enter email"
            error={errors.email}
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="w-full sm:w-auto">
              Submit
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </form>
      </ResponsiveCard>
    </ResponsiveContainer>
  );
};

/**
 * Example 4: Responsive Tabs/Navigation
 */
export const ResponsiveSettingsPage = () => {
  return (
    <ResponsiveContainer>
      <h1 className="mb-8 text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">Settings</h1>

      <Tabs
        tabs={[
          {
            label: "Account",
            content: (
              <div className="space-y-4">
                <Input label="Username" placeholder="Enter username" />
                <Input label="Email" type="email" placeholder="Enter email" />
                <Button variant="primary">Save Changes</Button>
              </div>
            ),
          },
          {
            label: "Security",
            content: (
              <div className="space-y-4">
                <Input label="Current Password" type="password" />
                <Input label="New Password" type="password" />
                <Input label="Confirm Password" type="password" />
                <Button variant="primary">Update Password</Button>
              </div>
            ),
          },
          {
            label: "Notifications",
            content: (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label>Email Notifications</label>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <label>SMS Notifications</label>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
                <Button variant="primary">Save Preferences</Button>
              </div>
            ),
          },
        ]}
      />
    </ResponsiveContainer>
  );
};

/**
 * Example 5: Full Responsive Admin Layout
 */
export const ResponsiveAdminLayout = ({ children }) => {
  const { isMobile } = useIsMobile();

  return (
    <ResponsiveLayout
      navbar={
        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
            <Button variant="ghost" size="sm">
              Logout
            </Button>
          </div>
        </div>
      }
      sidebar={
        <nav className="space-y-2 p-4">
          <NavItem icon="📊" label="Dashboard" />
          <NavItem icon="👥" label="Users" />
          <NavItem icon="📦" label="Products" />
          <NavItem icon="⚙️" label="Settings" />
        </nav>
      }
    >
      {children}
    </ResponsiveLayout>
  );
};

/**
 * Navigation Item Component
 */
const NavItem = ({ icon, label }) => (
  <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors">
    <span>{icon}</span>
    <span className="text-gray-900">{label}</span>
  </button>
);

/**
 * Export all examples
 */
export default {
  ResponsiveDashboard,
  ResponsiveDataTable,
  ResponsiveForm,
  ResponsiveSettingsPage,
  ResponsiveAdminLayout,
};
