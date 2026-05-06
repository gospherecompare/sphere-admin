# Component Migration Guide - Making UI Responsive

This guide shows how to migrate existing components to use the responsive system with step-by-step examples.

## Quick Start

### Before & After Examples

#### Example 1: Simple Page Layout

**BEFORE (Not Responsive):**
```jsx
import Dashboard from './Dashboard';

export default function AdminDashboard() {
  return <Dashboard />;
}
```

**AFTER (Fully Responsive):**
```jsx
import Dashboard from './Dashboard';
import { ResponsivePageWrapper } from '@/components/ui';

export default function AdminDashboard() {
  return (
    <ResponsivePageWrapper title="Dashboard" subtitle="Welcome to Admin Panel">
      <Dashboard />
    </ResponsivePageWrapper>
  );
}
```

---

## Migration Patterns by Component Type

### Pattern 1: Pages with Sidebar + Navbar

**BEFORE:**
```jsx
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Content from './Content';

export default function AdminPage() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <Navbar />
        <Content />
      </main>
    </div>
  );
}
```

**AFTER:**
```jsx
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Content from './Content';
import { ResponsiveMainLayout } from '@/components/ui';

export default function AdminPage() {
  return (
    <ResponsiveMainLayout
      sidebar={<Sidebar />}
      navbar={<Navbar />}
      showSidebar={true}
    >
      <Content />
    </ResponsiveMainLayout>
  );
}
```

---

### Pattern 2: Form Components

**BEFORE:**
```jsx
import { useState } from 'react';

export default function CreateProduct() {
  const [formData, setFormData] = useState({});

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Product</h1>
      <form>
        <div style={{ marginBottom: '20px' }}>
          <label>Name</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px' }}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Description</label>
          <textarea
            style={{ width: '100%', padding: '8px' }}
            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
          />
        </div>
        <button style={{ padding: '10px 20px' }}>Submit</button>
      </form>
    </div>
  );
}
```

**AFTER:**
```jsx
import { useState } from 'react';
import {
  ResponsivePageWrapper,
  ResponsivePageSection,
  Input,
  Button,
  Form,
} from '@/components/ui';

export default function CreateProduct() {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic
  };

  return (
    <ResponsivePageWrapper
      title="Create Product"
      subtitle="Add a new product to inventory"
      maxWidth="max-w-2xl"
    >
      <ResponsivePageSection>
        <Form onSubmit={handleSubmit} layout="vertical">
          <Input
            label="Product Name"
            placeholder="Enter product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            type="textarea"
            placeholder="Enter product description"
            value={formData.desc}
            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            required
          />

          <Button variant="primary" size="lg" fullWidth>
            Submit
          </Button>
        </Form>
      </ResponsivePageSection>
    </ResponsivePageWrapper>
  );
}
```

---

### Pattern 3: Data Table/List

**BEFORE:**
```jsx
export default function UserList() {
  const [users, setUsers] = useState([]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Users</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**AFTER:**
```jsx
import {
  ResponsivePageWrapper,
  ResponsivePageSection,
  AdvancedDataTable,
  Button,
} from '@/components/ui';

export default function UserList() {
  const [users, setUsers] = useState([]);

  const columns = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email', width: '250px' },
  ];

  const handleEdit = (user) => {
    // Handle edit
  };

  const handleDelete = (user) => {
    // Handle delete
  };

  return (
    <ResponsivePageWrapper title="Users" subtitle="Manage system users">
      <ResponsivePageSection>
        <AdvancedDataTable
          columns={columns}
          data={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          enableSearch
          enableSort
          enableSelect
        />
      </ResponsivePageSection>
    </ResponsivePageWrapper>
  );
}
```

---

### Pattern 4: Grid Layout

**BEFORE:**
```jsx
export default function Dashboard() {
  const stats = [
    { label: 'Users', value: '1,234' },
    { label: 'Products', value: '567' },
    { label: 'Orders', value: '890' },
    { label: 'Revenue', value: '$12,345' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginTop: '20px'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}>
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**AFTER:**
```jsx
import {
  ResponsivePageWrapper,
  ResponsivePageSection,
  ResponsiveStatGrid,
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaDollarSign,
} from '@/components/ui';

export default function Dashboard() {
  const stats = [
    { label: 'Users', value: '1,234', icon: <FaUsers /> },
    { label: 'Products', value: '567', icon: <FaBox /> },
    { label: 'Orders', value: '890', icon: <FaShoppingCart /> },
    { label: 'Revenue', value: '$12,345', icon: <FaDollarSign /> },
  ];

  return (
    <ResponsivePageWrapper title="Dashboard">
      <ResponsivePageSection>
        <ResponsiveStatGrid
          stats={stats}
          cols={{ mobile: 1, sm: 2, md: 2, lg: 4 }}
        />
      </ResponsivePageSection>
    </ResponsivePageWrapper>
  );
}
```

---

## Common Migration Tasks

### Task 1: Replace Inline Styles with Tailwind Classes

**BEFORE:**
```jsx
<div style={{
  padding: '20px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}>
  Content
</div>
```

**AFTER:**
```jsx
<div className="p-6 bg-gray-50 rounded-lg shadow-sm">
  Content
</div>
```

---

### Task 2: Replace Display: Grid with ResponsiveGrid

**BEFORE:**
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px'
}}>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>
```

**AFTER:**
```jsx
import { ResponsiveGrid } from '@/components/ui';

<ResponsiveGrid
  cols={{ mobile: 1, sm: 2, md: 3, lg: 4 }}
  gap="gap-6"
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ResponsiveGrid>
```

---

### Task 3: Replace Form Inputs

**BEFORE:**
```jsx
<div>
  <label htmlFor="name">Name</label>
  <input
    id="name"
    type="text"
    style={{
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px'
    }}
    placeholder="Enter name"
  />
</div>
```

**AFTER:**
```jsx
import { Input } from '@/components/ui';

<Input
  label="Name"
  placeholder="Enter name"
  size="md"
/>
```

---

### Task 4: Replace Buttons

**BEFORE:**
```jsx
<button style={{
  padding: '10px 20px',
  backgroundColor: '#6b21a8',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
}}>
  Click Me
</button>
```

**AFTER:**
```jsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Click Me
</Button>
```

---

## Responsive Breakpoints Cheat Sheet

Map your current breakpoint logic to Tailwind classes:

| Size | Tailwind Class | CSS | When to Use |
|------|----------------|-----|-----------|
| Mobile | `md:` | 768px+ | Hidden on mobile, visible at tablets |
| Tablet | `lg:` | 1024px+ | Hidden on mobile/tablet, visible at desktop |
| Desktop | `xl:` | 1280px+ | Only very large screens |
| Mobile Only | `hidden md:block` | Display mobile-only layout | Drawer, mobile menu |
| Desktop Only | `hidden lg:block` | Hide on mobile/tablet | Sidebar, complex layouts |

---

## Testing Responsive Design

### Desktop Browser Testing
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select different devices: iPhone 12, iPad, Desktop
4. Verify layout adapts properly at each breakpoint

### Common Issues & Fixes

**Issue: Content overflows on mobile**
- Add `w-full` to containers
- Use `px-4 md:px-6` for responsive padding
- Test with smallest devices (iPhone SE at 375px)

**Issue: Text too small on mobile**
- Use responsive text sizes: `text-sm md:text-base lg:text-lg`
- Never set fixed px sizes for text

**Issue: Buttons hard to tap on mobile**
- Use `touch-target` class (44px minimum)
- Add `py-3` padding instead of `py-1`

---

## Next Steps

1. **Identify priority components** - Start with high-traffic pages (Dashboard, List views)
2. **Use wrappers first** - Wrap existing components with `ResponsivePageWrapper`
3. **Gradually migrate** - Replace one component type at a time
4. **Test on devices** - Use DevTools device simulation
5. **Ask questions** - Reference examples above when unsure

---

## Component Migration Checklist

For each component being migrated:

- [ ] Replaced inline `style={{}}` with Tailwind classes
- [ ] Replaced `<div>` wrappers with responsive layout components
- [ ] Used `ResponsiveGrid` instead of custom grid CSS
- [ ] Replaced form elements with ERP components (Input, Select, Button)
- [ ] Added responsive font sizes (text-sm, text-base, text-lg)
- [ ] Added responsive padding (px-4, md:px-6, lg:px-8)
- [ ] Tested on mobile (320px), tablet (768px), desktop (1024px+)
- [ ] Verified touch targets are 44px minimum
- [ ] No horizontal scroll on any device

---

## Questions & Support

For issues with specific components, check:
1. [ResponsiveComponents.jsx](../ui/ResponsiveLayoutComponents.jsx) - Layout primitives
2. [ERPComponents.jsx](../ui/ERPComponents.jsx) - Form elements & buttons
3. [AdvancedComponents.jsx](../ui/AdvancedComponents.jsx) - Tables, modals, forms
4. [useResponsive.js](../../hooks/useResponsive.js) - Responsive hooks
