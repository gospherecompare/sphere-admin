/\*\*

- Integration Guide: Converting Existing Components to Mobile-Responsive ERP Style
-
- This guide shows step-by-step how to convert existing components in client_1
- to use the new responsive and ERP styling system.
  \*/

// ============================================================================
// BEFORE & AFTER EXAMPLES
// ============================================================================

/_
============================================================================
EXAMPLE 1: Converting a Basic Form Component
============================================================================
_/

// BEFORE: Basic form without responsive design
const OldForm = () => {
return (
<div style={{ padding: '20px' }}>
<h2>Create Item</h2>
<div style={{ marginBottom: '15px' }}>
<label>Name</label>
<input type="text" placeholder="Enter name" style={{ width: '100%', padding: '10px' }} />
</div>
<div style={{ marginBottom: '15px' }}>
<label>Email</label>
<input type="email" placeholder="Enter email" style={{ width: '100%', padding: '10px' }} />
</div>
<button style={{ padding: '10px 20px', background: '#007bff', color: 'white' }}>
Submit
</button>
</div>
);
};

// AFTER: Responsive ERP styled form
import { Input, Button } from '@/components/ui/ERPComponents';
import { ResponsiveContainer, ResponsiveCard } from '@/components/layout/ResponsiveComponents';

const NewForm = () => {
return (
<ResponsiveContainer>
<ResponsiveCard>
<h2 className="text-responsive-h2 text-gray-900 mb-6">Create Item</h2>
<div className="form-responsive">
<Input label="Name" placeholder="Enter name" required />
<Input label="Email" type="email" placeholder="Enter email" required />
<Button variant="primary">Submit</Button>
</div>
</ResponsiveCard>
</ResponsiveContainer>
);
};

/_
============================================================================
EXAMPLE 2: Converting a Table Component
============================================================================
_/

// BEFORE: Non-responsive table
const OldTable = ({ data }) => {
return (
<div style={{ overflowX: 'auto' }}>
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
<thead>
<tr style={{ background: '#f0f0f0' }}>
<th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
<th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
<th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
</tr>
</thead>
<tbody>
{data.map(row => (
<tr key={row.id}>
<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{row.name}</td>
<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{row.email}</td>
<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{row.status}</td>
</tr>
))}
</tbody>
</table>
</div>
);
};

// AFTER: Responsive ERP table with features
import { AdvancedDataTable } from '@/components/ui/AdvancedComponents';
import { Badge } from '@/components/ui/ERPComponents';

const NewTable = ({ data }) => {
return (
<AdvancedDataTable
title="Users"
columns={[
{ key: 'name', label: 'Name' },
{ key: 'email', label: 'Email' },
{
key: 'status',
label: 'Status',
render: (val) => (
<Badge variant={val === 'Active' ? 'success' : 'warning'}>
{val}
</Badge>
),
},
]}
data={data}
selectable
sortable
filterable
pagination
/>
);
};

/_
============================================================================
EXAMPLE 3: Converting a Dashboard/Grid Layout
============================================================================
_/

// BEFORE: Fixed-width grid
const OldDashboard = () => {
return (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '20px' }}>
<div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
<h3>Card 1</h3>
<p>Content</p>
</div>
<div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
<h3>Card 2</h3>
<p>Content</p>
</div>
{/_ ... more cards _/}
</div>
);
};

// AFTER: Mobile-first responsive grid
import { ResponsiveGrid } from '@/components/layout/ResponsiveComponents';
import { StatCard } from '@/components/ui/ERPComponents';
import { Users, TrendingUp, Activity } from 'react-icons/fa';

const NewDashboard = () => {
return (
<ResponsiveContainer>
<ResponsiveGrid cols={{ mobile: 1, sm: 2, md: 3, lg: 4 }} gap="gap-4">
<StatCard
          title="Total Users"
          value="1,234"
          icon={Users}
          color="purple"
        />
<StatCard
          title="Revenue"
          value="$45,231"
          icon={TrendingUp}
          color="blue"
        />
<StatCard
          title="Active Sessions"
          value="342"
          icon={Activity}
          color="green"
        />
</ResponsiveGrid>
</ResponsiveContainer>
);
};

/_
============================================================================
EXAMPLE 4: Converting with useResponsive Hook
============================================================================
_/

// BEFORE: Conditional rendering without hook
const OldResponsiveComponent = () => {
const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

React.useEffect(() => {
const handleResize = () => setIsMobile(window.innerWidth < 768);
window.addEventListener('resize', handleResize);
return () => window.removeEventListener('resize', handleResize);
}, []);

return isMobile ? <MobileView /> : <DesktopView />;
};

// AFTER: Clean hook-based approach
import { useResponsive } from '@/hooks/useResponsive';

const NewResponsiveComponent = () => {
const { isMobile, isTablet, isDesktop, screenSize } = useResponsive();

if (isMobile) return <MobileView />;
if (isTablet) return <TabletView />;
return <DesktopView />;
};

// Or simpler:
const SimpleResponsiveComponent = () => {
const isMobile = useIsMobile();
return isMobile ? <MobileLayout /> : <DesktopLayout />;
};

/_
============================================================================
EXAMPLE 5: Converting Modal Component
============================================================================
_/

// BEFORE: Non-responsive modal
const OldModal = ({ isOpen, onClose }) => {
if (!isOpen) return null;

return (
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '400px' }}>
<h2>Modal Title</h2>
<p>Modal content</p>
<button onClick={onClose}>Close</button>
</div>
</div>
);
};

// AFTER: Responsive modal
import { Modal } from '@/components/ui/AdvancedComponents';
import { Button } from '@/components/ui/ERPComponents';

const NewModal = ({ isOpen, onClose }) => {
return (
<Modal
isOpen={isOpen}
onClose={onClose}
title="Modal Title"
size="md"
footer={[
<Button key="cancel" variant="outline" onClick={onClose}>
Cancel
</Button>,
<Button key="confirm" variant="primary" onClick={onClose}>
Confirm
</Button>,
]} >
<p>Modal content goes here</p>
</Modal>
);
};

// ============================================================================
// STEP-BY-STEP MIGRATION CHECKLIST
// ============================================================================

/\*
FOR EACH COMPONENT FILE, FOLLOW THIS PROCESS:

1. REPLACE IMPORTS
   ❌ Remove: inline styles, Material-UI components
   ✅ Add: import { Button, Input, ... } from '@/components/ui/ERPComponents'
   ✅ Add: import { ResponsiveContainer, ... } from '@/components/layout/ResponsiveComponents'
   ✅ Add: import { useResponsive } from '@/hooks/useResponsive'

2. REPLACE INLINE STYLES
   ❌ style={{ padding: '20px', display: 'flex' }}
   ✅ className="px-4 md:px-6 flex flex-col md:flex-row"

3. REPLACE DIV WRAPPERS WITH RESPONSIVE COMPONENTS
   ❌ <div className="container">
   ✅ <ResponsiveContainer>

4. REPLACE GRIDS
   ❌ <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
   ✅ <ResponsiveGrid cols={{ mobile: 1, sm: 2, md: 3, lg: 4 }}>

5. REPLACE FORMS
   ❌ <input /> with manual styling
   ✅ <Input label="Name" required />

6. REPLACE BUTTONS
   ❌ <button style={{ background: '#007bff' }}>
   ✅ <Button variant="primary">

7. REPLACE TABLES
   ❌ Manual <table> with inline styles
   ✅ <AdvancedDataTable columns={...} data={...} />

8. ADD RESPONSIVE LOGIC
   ❌ Manual window.addEventListener('resize')
   ✅ const { isMobile, isDesktop } = useResponsive()

9. TEST ON MOBILE
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test all breakpoints

10. CLEANUP - Remove unused imports - Verify responsive classes - Test touch interactions
    \*/

// ============================================================================
// COMMON TAILWIND CLASS REPLACEMENTS
// ============================================================================

/\*
SPACING
Old: style={{ padding: '20px' }}
New: className="p-5"

Old: style={{ marginBottom: '15px' }}
New: className="mb-4"

FLEXBOX
Old: style={{ display: 'flex', justifyContent: 'space-between' }}
New: className="flex justify-between"

Old: style={{ display: 'flex', flexDirection: 'column' }}
New: className="flex flex-col"

GRID
Old: style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}
New: className="grid grid-cols-3 gap-4"

RESPONSIVE GRID
Old: Not possible with inline styles
New: className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

TEXT
Old: style={{ fontSize: '18px', fontWeight: 'bold' }}
New: className="text-lg font-bold"

COLORS
Old: style={{ color: '#007bff', background: '#f0f0f0' }}
New: className="text-blue-600 bg-gray-100"

BORDERS
Old: style={{ borderBottom: '1px solid #ddd' }}
New: className="border-b border-gray-300"

SHADOW
Old: style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
New: className="shadow-md"
\*/

// ============================================================================
// QUICK REFERENCE: RESPONSIVE CLASSES
// ============================================================================

/\*
Mobile-First Approach (apply base style, then override at breakpoints):

Hidden/Visible:

- hidden md:block (hidden on mobile, show on tablet+)
- block md:hidden (show on mobile, hidden on tablet+)

Layout:

- flex flex-col md:flex-row (stack on mobile, row on tablet+)
- grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

Text:

- text-sm md:text-base lg:text-lg

Padding:

- px-4 md:px-6 lg:px-8 (responsive horizontal padding)
- py-4 md:py-6 lg:py-8 (responsive vertical padding)

Display:

- w-full md:w-1/2 (width responsive)
- h-20 md:h-24 (height responsive)
  \*/

// ============================================================================
// MIGRATION TIMELINE EXAMPLE
// ============================================================================

/\*
PHASE 1: Core Components (Week 1)

- Update Dashboard.jsx
- Update ViewMobiles.jsx
- Update ViewLaptops.jsx

PHASE 2: Forms & Inputs (Week 2)

- Update CreateMobile.jsx
- Update CreateLaptop.jsx
- Update EditMobile.jsx

PHASE 3: Tables & Lists (Week 3)

- Update all Report components
- Update ViewCustomers.jsx
- Update UserManagement.jsx

PHASE 4: Layout & Navigation (Week 4)

- Update Sidebar.jsx
- Update Navbar.jsx
- Update MainLayout.jsx

PHASE 5: Testing & Polish (Week 5)

- Mobile testing
- Touch interaction testing
- Performance optimization
  \*/

export default {
OldForm,
NewForm,
OldTable,
NewTable,
OldDashboard,
NewDashboard,
OldResponsiveComponent,
NewResponsiveComponent,
OldModal,
NewModal,
};
