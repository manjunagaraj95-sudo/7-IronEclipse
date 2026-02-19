
import React, { useState, useEffect, createContext, useContext } from 'react';

// --- Constants ---
const ROLES = {
    ADMIN: 'Admin',
    CUSTOMER: 'Customer',
    SERVICE_PROVIDER: 'Service Provider',
};

const PERMISSIONS = {
    [ROLES.ADMIN]: {
        dashboards: ['AdminDashboard'],
        forms: ['RateSetupForm', 'PartnerSetupForm', 'OrderForm'],
        lists: ['OrdersList', 'PartnersList'],
        actions: ['approveOrder', 'updatePricing', 'managePartners'],
    },
    [ROLES.CUSTOMER]: {
        dashboards: ['CustomerDashboard'],
        forms: ['OrderForm', 'RegistrationForm'],
        lists: ['OrdersList'],
        actions: ['placeOrder', 'viewOrderStatus'],
    },
    [ROLES.SERVICE_PROVIDER]: {
        dashboards: ['ServiceProviderDashboard'],
        forms: ['OrderUpdateForm'],
        lists: ['OrdersQueue'],
        actions: ['acceptOrder', 'markIroning', 'markReady', 'markDelivered', 'markPicked'],
    },
};

const STATUS_COLORS = {
    CREATED: { bg: 'card-status-grey', accent: 'grey', headerBg: '#9ca3af' },
    ACCEPTED: { bg: 'card-status-blue', accent: 'blue', headerBg: '#60a5fa' },
    IRONING: { bg: 'card-status-blue', accent: 'blue', headerBg: '#60a5fa' },
    READY: { bg: 'card-status-green', accent: 'green', headerBg: '#34d399' },
    DELIVERED: { bg: 'card-status-green', accent: 'green', headerBg: '#34d399' },
    PICKED_UP: { bg: 'card-status-green', accent: 'green', headerBg: '#34d399' },
    REJECTED: { bg: 'card-status-red', accent: 'red', headerBg: '#f87171' },
    PENDING_PAYMENT: { bg: 'card-status-orange', accent: 'orange', headerBg: '#fbbf24' },
    SLA_BREACH: { bg: 'card-status-red', accent: 'red', headerBg: '#f87171' },
    DRAFT: { bg: 'card-status-grey', accent: 'grey', headerBg: '#9ca3af' },
    ACTIVE: { bg: 'card-status-green', accent: 'green', headerBg: '#34d399' },
    INACTIVE: { bg: 'card-status-grey', accent: 'grey', headerBg: '#9ca3af' },
};

// --- Dummy Data ---
const DUMMY_USERS = [
    { id: 'u1', name: 'Admin User', role: ROLES.ADMIN, avatar: 'AU' },
    { id: 'u2', name: 'Customer One', role: ROLES.CUSTOMER, avatar: 'C1' },
    { id: 'u3', name: 'Ironing Partner', role: ROLES.SERVICE_PROVIDER, avatar: 'IP' },
];

const DUMMY_PARTNERS = [
    { id: 'p1', name: 'Sparkle Ironers', contact: 'partner1@example.com', status: 'ACTIVE' },
    { id: 'p2', name: 'Crisp & Clean', contact: 'partner2@example.com', status: 'ACTIVE' },
    { id: 'p3', name: 'Fast Ironing Co.', contact: 'partner3@example.com', status: 'INACTIVE' },
];

const DUMMY_ORDERS = [
    {
        id: 'O001', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p1', serviceProviderName: 'Sparkle Ironers',
        items: [{ type: 'Shirt', qty: 5, price: 50 }, { type: 'Trousers', qty: 2, price: 60 }],
        totalPrice: 370, status: 'READY', deliveryOption: 'Doorstep', deliveryAddress: '123 Main St',
        timeline: [
            { stage: 'Created', date: '2024-07-20T10:00:00Z', actor: 'Customer One' },
            { stage: 'Accepted', date: '2024-07-20T10:30:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Ironing', date: '2024-07-20T11:00:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Ready', date: '2024-07-20T14:00:00Z', actor: 'Sparkle Ironers', slaBreach: false },
        ],
        dueDate: '2024-07-20T18:00:00Z', createdAt: '2024-07-20T10:00:00Z',
    },
    {
        id: 'O002', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p2', serviceProviderName: 'Crisp & Clean',
        items: [{ type: 'Bed Sheet', qty: 1, price: 120 }],
        totalPrice: 120, status: 'IRONING', deliveryOption: 'Customer Pickup',
        timeline: [
            { stage: 'Created', date: '2024-07-21T09:00:00Z', actor: 'Customer One' },
            { stage: 'Accepted', date: '2024-07-21T09:15:00Z', actor: 'Crisp & Clean' },
            { stage: 'Ironing', date: '2024-07-21T10:00:00Z', actor: 'Crisp & Clean' },
        ],
        dueDate: '2024-07-21T14:00:00Z', createdAt: '2024-07-21T09:00:00Z',
    },
    {
        id: 'O003', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p1', serviceProviderName: 'Sparkle Ironers',
        items: [{ type: 'Shirt', qty: 3, price: 50 }],
        totalPrice: 150, status: 'CREATED', deliveryOption: 'Doorstep', deliveryAddress: '123 Main St',
        timeline: [
            { stage: 'Created', date: '2024-07-22T11:00:00Z', actor: 'Customer One' },
        ],
        dueDate: '2024-07-22T15:00:00Z', createdAt: '2024-07-22T11:00:00Z',
    },
    {
        id: 'O004', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p2', serviceProviderName: 'Crisp & Clean',
        items: [{ type: 'Curtains', qty: 2, price: 200 }],
        totalPrice: 400, status: 'DELIVERED', deliveryOption: 'Doorstep', deliveryAddress: '456 Oak Ave',
        timeline: [
            { stage: 'Created', date: '2024-07-19T10:00:00Z', actor: 'Customer One' },
            { stage: 'Accepted', date: '2024-07-19T10:30:00Z', actor: 'Crisp & Clean' },
            { stage: 'Ironing', date: '2024-07-19T11:00:00Z', actor: 'Crisp & Clean' },
            { stage: 'Ready', date: '2024-07-19T14:00:00Z', actor: 'Crisp & Clean' },
            { stage: 'Delivered', date: '2024-07-19T16:00:00Z', actor: 'Crisp & Clean' },
        ],
        dueDate: '2024-07-19T16:00:00Z', createdAt: '2024-07-19T10:00:00Z',
    },
    {
        id: 'O005', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p1', serviceProviderName: 'Sparkle Ironers',
        items: [{ type: 'Shirt', qty: 10, price: 50 }],
        totalPrice: 500, status: 'READY', deliveryOption: 'Customer Pickup',
        timeline: [
            { stage: 'Created', date: '2024-07-18T10:00:00Z', actor: 'Customer One' },
            { stage: 'Accepted', date: '2024-07-18T10:30:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Ironing', date: '2024-07-18T11:00:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Ready', date: '2024-07-18T14:00:00Z', actor: 'Sparkle Ironers', slaBreach: false },
        ],
        dueDate: '2024-07-18T18:00:00Z', createdAt: '2024-07-18T10:00:00Z',
    },
    {
        id: 'O006', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p2', serviceProviderName: 'Crisp & Clean',
        items: [{ type: 'Saree', qty: 2, price: 150 }],
        totalPrice: 300, status: 'ACCEPTED', deliveryOption: 'Doorstep', deliveryAddress: '456 Oak Ave',
        timeline: [
            { stage: 'Created', date: '2024-07-22T08:00:00Z', actor: 'Customer One' },
            { stage: 'Accepted', date: '2024-07-22T08:30:00Z', actor: 'Crisp & Clean' },
        ],
        dueDate: '2024-07-22T12:00:00Z', createdAt: '2024-07-22T08:00:00Z',
    },
    {
        id: 'O007', customerId: 'u2', customerName: 'Customer One', serviceProviderId: 'p1', serviceProviderName: 'Sparkle Ironers',
        items: [{ type: 'Shirt', qty: 7, price: 50 }],
        totalPrice: 350, status: 'PICKED_UP', deliveryOption: 'Customer Pickup',
        timeline: [
            { stage: 'Created', date: '2024-07-17T14:00:00Z', actor: 'Customer One' },
            { stage: 'Accepted', date: '2024-07-17T14:30:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Ironing', date: '2024-07-17T15:00:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Ready', date: '2024-07-17T17:00:00Z', actor: 'Sparkle Ironers' },
            { stage: 'Picked Up', date: '2024-07-17T18:30:00Z', actor: 'Customer One' },
        ],
        dueDate: '2024-07-17T18:30:00Z', createdAt: '2024-07-17T14:00:00Z',
    },
];

const DUMMY_ACTIVITIES = [
    { id: 'a1', role: ROLES.CUSTOMER, type: 'Order Placed', entityId: 'O003', entityType: 'Order', message: 'Order O003 for 3 Shirts placed.', date: '2024-07-22T11:05:00Z' },
    { id: 'a2', role: ROLES.SERVICE_PROVIDER, type: 'Order Accepted', entityId: 'O006', entityType: 'Order', message: 'Order O006 accepted by Crisp & Clean.', date: '2024-07-22T08:35:00Z' },
    { id: 'a3', role: ROLES.ADMIN, type: 'Partner Activated', entityId: 'p1', entityType: 'Partner', message: 'Sparkle Ironers status updated to ACTIVE.', date: '2024-07-21T16:00:00Z' },
    { id: 'a4', role: ROLES.CUSTOMER, type: 'Order Ready', entityId: 'O001', entityType: 'Order', message: 'Order O001 is now ready for pickup/delivery.', date: '2024-07-20T14:05:00Z' },
    { id: 'a5', role: ROLES.SERVICE_PROVIDER, type: 'Order Completed', entityId: 'O004', entityType: 'Order', message: 'Order O004 marked as Delivered.', date: '2024-07-19T16:05:00Z' },
    { id: 'a6', role: ROLES.ADMIN, type: 'Pricing Updated', entityId: 'Rate:Shirt', entityType: 'Rate', message: 'Shirt pricing updated to $50.', date: '2024-07-18T09:00:00Z' },
];

const DUMMY_RATES = [
    { type: 'Shirt', price: 50 },
    { type: 'Trousers', price: 60 },
    { type: 'Bed Sheet', price: 120 },
    { type: 'Saree', price: 150 },
    { type: 'Curtains', price: 200 },
];

// --- Contexts ---
const AuthContext = createContext(null);
const NavigationContext = createContext(null);
const NotificationContext = createContext(null);
const ThemeContext = createContext(null);

// --- Hooks ---
const useAuth = () => useContext(AuthContext);
const useNavigation = () => useContext(NavigationContext);
const useNotifications = () => useContext(NotificationContext);
const useTheme = () => useContext(ThemeContext);

// --- Reusable Components ---
const Icon = ({ name, className = '' }) => <i className={`fas fa-${name} ${className}`}></i>;

const Button = ({ children, onClick, variant = 'primary', icon, className = '' }) => (
    <button className={`btn btn-${variant} ${className}`} onClick={onClick}>
        {icon && <Icon name={icon} />}
        {children}
    </button>
);

const Input = ({ label, type = 'text', name, value, onChange, placeholder, error, mandatory = false }) => (
    <div className="form-group">
        <label className="form-label">{label}{mandatory && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`form-input ${error ? 'error' : ''}`}
        />
        {error && <p className="form-error-message">{error}</p>}
    </div>
);

const Select = ({ label, name, value, onChange, options, error, mandatory = false }) => (
    <div className="form-group">
        <label className="form-label">{label}{mandatory && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`form-select ${error ? 'error' : ''}`}
        >
            {options.map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
            ))}
        </select>
        {error && <p className="form-error-message">{error}</p>}
    </div>
);

const AccordionPanel = ({ title, children, isOpen, onToggle }) => (
    <div className="accordion-panel">
        <div className={`accordion-header ${isOpen ? 'active' : ''}`} onClick={onToggle}>
            <span>{title}</span>
            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
        </div>
        <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
            {children}
        </div>
    </div>
);

const ColorfulCard = ({ id, status, title, description, kpi, onClick, actions = [], footer, fullWidth = false }) => {
    const statusClass = STATUS_COLORS[status]?.bg || 'card-status-grey';
    const accentColor = STATUS_COLORS[status]?.accent || 'grey';
    const iconMap = {
        'CREATED': 'receipt', 'ACCEPTED': 'handshake', 'IRONING': 'tshirt',
        'READY': 'check-circle', 'DELIVERED': 'truck', 'PICKED_UP': 'box-open',
        'REJECTED': 'times-circle', 'PENDING_PAYMENT': 'credit-card',
        'SLA_BREACH': 'exclamation-triangle', 'DRAFT': 'edit',
        'ACTIVE': 'check', 'INACTIVE': 'times',
    };
    const titleIcon = iconMap[status] || 'question-circle';

    return (
        <div className={`card ${statusClass} ${fullWidth ? 'full-width' : ''}`} onClick={() => onClick && onClick(id)}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={titleIcon} style={{ color: 'white' }} />
                    <span style={{ color: 'white' }}>{title}</span>
                </div>
                {kpi && <span className={`status-badge ${accentColor}`}>{kpi}</span>}
            </div>
            <div className="card-content">
                <p>{description}</p>
                {actions.length > 0 && (
                    <div className="flex gap-sm mt-md">
                        {actions.map((action, idx) => (
                            <Button key={idx} variant="outline" onClick={(e) => { e.stopPropagation(); action.handler(id); }} icon={action.icon}>
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
};

const KPICard = ({ title, value, icon, trend, trendValue, onClick }) => {
    const trendClass = trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral';
    const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus';
    return (
        <div className="kpi-card" onClick={onClick}>
            <div className="kpi-card-title">{title}</div>
            <div className="kpi-card-value">
                {icon && <Icon name={icon} className="kpi-card-icon" />}
                {value}
            </div>
            {trend && (
                <div className={`kpi-card-trend ${trendClass}`}>
                    <Icon name={trendIcon} />
                    <span>{trendValue}</span>
                </div>
            )}
        </div>
    );
};

const ChartCard = ({ title, type, data, onClick }) => (
    <div className="chart-card" onClick={onClick}>
        <div className="kpi-card-title">{title}</div>
        <div className="chart-placeholder">
            {type} Chart Placeholder
        </div>
        {/* Real charts would go here */}
    </div>
);

const ActivityCard = ({ activity }) => (
    <ColorfulCard
        id={activity.id}
        status={'INFO'} // Activities are generally informative, not status-driven
        title={activity.type}
        description={activity.message}
        footer={`On ${new Date(activity.date).toLocaleString()}`}
        onClick={() => {}} // Not clickable per spec, but mandatory card, so no-op
    />
);

const NotificationToast = ({ notification }) => {
    const { id, type, title, message } = notification;
    const iconMap = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle',
    };

    return (
        <div className={`notification-toast ${type}`}>
            <Icon name={iconMap[type]} className="notification-icon" />
            <div className="notification-content">
                <div className="notification-title">{title}</div>
                <div className="notification-message">{message}</div>
            </div>
        </div>
    );
};

const WorkflowStepper = ({ timeline }) => (
    <div className="workflow-stepper">
        {timeline.map((step, index) => {
            const isCompleted = index < timeline.filter(t => t.stage !== 'Created').length; // Simple logic
            const isActive = index === timeline.length - 1;
            const isSlaBreach = step.slaBreach;
            const statusClass = isCompleted ? 'completed' : isActive ? 'active' : '';

            return (
                <div key={index} className={`step-item ${statusClass} ${isSlaBreach ? 'sla-breach' : ''}`}>
                    <div className="step-indicator">
                        {isCompleted ? <Icon name="check" /> : index + 1}
                    </div>
                    <div className="step-content">
                        <div className="step-title">
                            {step.stage}
                            {isSlaBreach && <span className="step-sla-badge">SLA BREACH</span>}
                        </div>
                        <div className="step-date">{step.date ? new Date(step.date).toLocaleString() : 'Pending'}</div>
                        {step.actor && <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>By: {step.actor}</div>}
                    </div>
                </div>
            );
        })}
    </div>
);

// --- Forms ---
const RegistrationForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: ROLES.CUSTOMER });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required.';
        if (!formData.email) newErrors.email = 'Email is required.';
        if (!formData.password) newErrors.password = 'Password is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="form-container">
            <h2 className="text-2xl font-bold mb-md">Customer Registration</h2>
            <form onSubmit={handleSubmit}>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} mandatory error={errors.name} />
                <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} mandatory error={errors.email} />
                <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} mandatory error={errors.password} />
                <div className="flex gap-md mt-lg">
                    <Button type="submit">Register</Button>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </div>
    );
};

const OrderForm = ({ initialData = {}, onSubmit, onCancel, customerId = DUMMY_USERS[1].id, isEdit = false }) => {
    const [formData, setFormData] = useState({
        customerId: customerId,
        customerName: DUMMY_USERS.find(u => u.id === customerId)?.name || 'N/A',
        items: initialData.items || [{ type: 'Shirt', qty: 1, price: DUMMY_RATES.find(r => r.type === 'Shirt')?.price || 50 }],
        deliveryOption: initialData.deliveryOption || 'Doorstep',
        deliveryAddress: initialData.deliveryAddress || '',
        status: initialData.status || 'CREATED',
        serviceProviderId: initialData.serviceProviderId || '',
        serviceProviderName: initialData.serviceProviderName || '',
    });
    const [errors, setErrors] = useState({});
    const [openAccordion, setOpenAccordion] = useState('OrderDetails');
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (isEdit && initialData.id) {
            setFormData(initialData);
        }
    }, [initialData, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, e) => {
        const newItems = [...formData.items];
        const rate = DUMMY_RATES.find(r => r.type === e.target.value);
        newItems[index] = {
            ...newItems[index],
            [e.target.name]: e.target.value,
            price: rate ? rate.price : newItems[index].price, // Update price if type changes
        };
        setFormData({ ...formData, items: newItems });
    };

    const handleItemQtyChange = (index, e) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], qty: parseInt(e.target.value) || 0 };
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { type: 'Shirt', qty: 1, price: DUMMY_RATES.find(r => r.type === 'Shirt')?.price || 50 }],
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const validate = () => {
        const newErrors = {};
        if (formData.items.length === 0) newErrors.items = 'At least one item is required.';
        if (formData.deliveryOption === 'Doorstep' && !formData.deliveryAddress) newErrors.deliveryAddress = 'Delivery address is required for doorstep delivery.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const totalPrice = formData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
            onSubmit({ ...formData, totalPrice });
            addNotification({ type: 'success', title: isEdit ? 'Order Updated' : 'Order Placed', message: `Order ${initialData.id || ''} successfully ${isEdit ? 'updated' : 'placed'}.` });
        } else {
            addNotification({ type: 'error', title: 'Validation Error', message: 'Please correct the form errors.' });
        }
    };

    const toggleAccordion = (panelName) => {
        setOpenAccordion(openAccordion === panelName ? null : panelName);
    };

    const clothTypeOptions = DUMMY_RATES.map(rate => ({ value: rate.type, label: rate.type }));
    const serviceProviderOptions = DUMMY_PARTNERS.filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: p.name }));

    return (
        <div className="form-container">
            <h2 className="text-2xl font-bold mb-md">{isEdit ? `Edit Order ${initialData.id}` : 'Place New Order'}</h2>
            <form onSubmit={handleSubmit}>
                <AccordionPanel title="Order Details" isOpen={openAccordion === 'OrderDetails'} onToggle={() => toggleAccordion('OrderDetails')}>
                    <Input label="Customer Name" name="customerName" value={formData.customerName} readOnly />
                    <div className="flex flex-col gap-sm mb-md">
                        <label className="form-label">Items</label>
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-sm items-center">
                                <Select
                                    name="type"
                                    value={item.type}
                                    onChange={(e) => handleItemChange(index, e)}
                                    options={clothTypeOptions}
                                />
                                <Input
                                    type="number"
                                    name="qty"
                                    value={item.qty}
                                    onChange={(e) => handleItemQtyChange(index, e)}
                                    placeholder="Qty"
                                    style={{ width: '80px' }}
                                />
                                <span style={{ whiteSpace: 'nowrap' }}>${item.price * item.qty}</span>
                                <Button type="button" variant="danger" icon="trash" onClick={() => removeItem(index)} />
                            </div>
                        ))}
                        {errors.items && <p className="form-error-message">{errors.items}</p>}
                        <Button type="button" variant="outline" icon="plus" onClick={addItem}>Add Item</Button>
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Delivery Options" isOpen={openAccordion === 'DeliveryOptions'} onToggle={() => toggleAccordion('DeliveryOptions')}>
                    <Select
                        label="Delivery Option"
                        name="deliveryOption"
                        value={formData.deliveryOption}
                        onChange={handleChange}
                        options={[
                            { value: 'Doorstep', label: 'Doorstep Delivery' },
                            { value: 'Customer Pickup', label: 'Customer Pickup' },
                        ]}
                        mandatory
                    />
                    {formData.deliveryOption === 'Doorstep' && (
                        <Input
                            label="Delivery Address"
                            name="deliveryAddress"
                            value={formData.deliveryAddress}
                            onChange={handleChange}
                            mandatory
                            error={errors.deliveryAddress}
                        />
                    )}
                </AccordionPanel>

                {isEdit && ( // Only show for SP/Admin editing existing orders
                    <AccordionPanel title="Service Provider & Status" isOpen={openAccordion === 'ServiceProviderStatus'} onToggle={() => toggleAccordion('ServiceProviderStatus')}>
                        <Select
                            label="Assign Service Provider"
                            name="serviceProviderId"
                            value={formData.serviceProviderId}
                            onChange={(e) => setFormData({ ...formData, serviceProviderId: e.target.value, serviceProviderName: serviceProviderOptions.find(opt => opt.value === e.target.value)?.label || '' })}
                            options={[{ value: '', label: 'Select Service Provider' }, ...serviceProviderOptions]}
                            mandatory
                        />
                        <Select
                            label="Order Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={Object.keys(STATUS_COLORS).map(status => ({ value: status, label: status.replace(/_/g, ' ') }))}
                            mandatory
                        />
                    </AccordionPanel>
                )}


                <div className="flex gap-md mt-lg">
                    <Button type="submit">{isEdit ? 'Update Order' : 'Place Order'}</Button>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </div>
    );
};

const RateSetupForm = ({ initialData = {}, onSubmit, onCancel, isEdit = false }) => {
    const [formData, setFormData] = useState({
        type: initialData.type || '',
        price: initialData.price || '',
    });
    const [errors, setErrors] = useState({});
    const { addNotification } = useNotifications();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.type) newErrors.type = 'Cloth type is required.';
        if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            addNotification({ type: 'success', title: 'Rate Saved', message: `Rate for ${formData.type} updated.` });
        } else {
            addNotification({ type: 'error', title: 'Validation Error', message: 'Please correct the form errors.' });
        }
    };

    return (
        <div className="form-container">
            <h2 className="text-2xl font-bold mb-md">{isEdit ? `Edit Rate for ${initialData.type}` : 'Setup New Rate'}</h2>
            <form onSubmit={handleSubmit}>
                <Input label="Cloth Type" name="type" value={formData.type} onChange={handleChange} mandatory error={errors.type} readOnly={isEdit} />
                <Input label="Price (USD)" type="number" name="price" value={formData.price} onChange={handleChange} mandatory error={errors.price} />
                <div className="flex gap-md mt-lg">
                    <Button type="submit">{isEdit ? 'Update Rate' : 'Add Rate'}</Button>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </div>
    );
};

const PartnerSetupForm = ({ initialData = {}, onSubmit, onCancel, isEdit = false }) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        contact: initialData.contact || '',
        status: initialData.status || 'ACTIVE',
    });
    const [errors, setErrors] = useState({});
    const { addNotification } = useNotifications();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Partner name is required.';
        if (!formData.contact) newErrors.contact = 'Contact email/phone is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            addNotification({ type: 'success', title: 'Partner Saved', message: `Partner ${formData.name} successfully ${isEdit ? 'updated' : 'added'}.` });
        } else {
            addNotification({ type: 'error', title: 'Validation Error', message: 'Please correct the form errors.' });
        }
    };

    return (
        <div className="form-container">
            <h2 className="text-2xl font-bold mb-md">{isEdit ? `Edit Partner ${initialData.name}` : 'Setup New Partner'}</h2>
            <form onSubmit={handleSubmit}>
                <Input label="Partner Name" name="name" value={formData.name} onChange={handleChange} mandatory error={errors.name} />
                <Input label="Contact Info" name="contact" value={formData.contact} onChange={handleChange} mandatory error={errors.contact} />
                <Select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' },
                    ]}
                    mandatory
                />
                <div className="flex gap-md mt-lg">
                    <Button type="submit">{isEdit ? 'Update Partner' : 'Add Partner'}</Button>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </div>
    );
};

// --- Detail Views ---
const OrderDetailView = ({ order, onAction, goBack, canPerformAction }) => {
    const { addNotification } = useNotifications();

    const handleAction = (actionName) => {
        onAction(order.id, actionName);
        addNotification({ type: 'info', title: 'Order Action', message: `Order ${order.id} - ${actionName} initiated.` });
    };

    const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="full-screen-view">
            <div className="full-screen-header">
                <Button variant="outline" icon="arrow-left" onClick={goBack}>Back</Button>
                <h1 className="full-screen-title">Order Details: {order.id}</h1>
                <div className="flex gap-md">
                    {canPerformAction('acceptOrder') && order.status === 'CREATED' &&
                        <Button onClick={() => handleAction('accept')} variant="primary" icon="handshake">Accept Order</Button>}
                    {canPerformAction('markIroning') && order.status === 'ACCEPTED' &&
                        <Button onClick={() => handleAction('ironing')} variant="primary" icon="tshirt">Start Ironing</Button>}
                    {canPerformAction('markReady') && order.status === 'IRONING' &&
                        <Button onClick={() => handleAction('ready')} variant="primary" icon="check-circle">Mark Ready</Button>}
                    {canPerformAction('markDelivered') && order.status === 'READY' && order.deliveryOption === 'Doorstep' &&
                        <Button onClick={() => handleAction('delivered')} variant="primary" icon="truck">Mark Delivered</Button>}
                    {canPerformAction('markPicked') && order.status === 'READY' && order.deliveryOption === 'Customer Pickup' &&
                        <Button onClick={() => handleAction('pickedUp')} variant="primary" icon="box-open">Mark Picked Up</Button>}
                    {canPerformAction('approveOrder') && order.status === 'PENDING_PAYMENT' &&
                        <Button onClick={() => handleAction('approved')} variant="success" icon="thumbs-up">Approve Payment</Button>}
                </div>
            </div>

            <div className="full-screen-content card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <ColorfulCard
                    status={order.status}
                    title="Order Info"
                    description={`Customer: ${order.customerName} | Partner: ${order.serviceProviderName || 'Unassigned'}`}
                    kpi={order.status}
                    footer={`Total Items: ${totalItems} | Created: ${new Date(order.createdAt).toLocaleDateString()}`}
                    fullWidth
                >
                    <p><strong>Total Price:</strong> ${order.totalPrice}</p>
                    <p><strong>Delivery Option:</strong> {order.deliveryOption}</p>
                    {order.deliveryOption === 'Doorstep' && <p><strong>Address:</strong> {order.deliveryAddress}</p>}
                </ColorfulCard>

                <ColorfulCard
                    status={order.status}
                    title="Items"
                    description="Details of all items in this order."
                    fullWidth
                >
                    <ul>
                        {order.items.map((item, index) => (
                            <li key={index}>{item.qty} x {item.type} (${item.price}/each) - Total: ${item.qty * item.price}</li>
                        ))}
                    </ul>
                </ColorfulCard>

                <div style={{ gridColumn: '1 / -1' }}>
                    <h3 className="text-xl font-bold mb-md">Workflow Timeline</h3>
                    <WorkflowStepper timeline={order.timeline} />
                </div>
            </div>
        </div>
    );
};

const PartnerDetailView = ({ partner, goBack, onEdit }) => {
    return (
        <div className="full-screen-view">
            <div className="full-screen-header">
                <Button variant="outline" icon="arrow-left" onClick={goBack}>Back</Button>
                <h1 className="full-screen-title">Partner Details: {partner.name}</h1>
                <Button variant="primary" icon="edit" onClick={() => onEdit(partner)}>Edit Partner</Button>
            </div>
            <div className="full-screen-content card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <ColorfulCard
                    status={partner.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                    title="Partner Info"
                    description={`Contact: ${partner.contact}`}
                    kpi={partner.status}
                    fullWidth
                >
                    <p><strong>Partner ID:</strong> {partner.id}</p>
                    <p><strong>Status:</strong> {partner.status}</p>
                </ColorfulCard>
                <ColorfulCard
                    status={partner.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                    title="Performance Snapshot"
                    description="Future integration point for partner-specific KPIs."
                    fullWidth
                >
                    <p>Total Orders Processed: 50</p>
                    <p>Average Rating: 4.8 / 5</p>
                    <p>SLA Adherence: 95%</p>
                </ColorfulCard>
            </div>
        </div>
    );
};

// --- Dashboards ---
const CustomerDashboard = () => {
    const { navigateTo } = useNavigation();
    const { currentUser } = useAuth();
    const customerOrders = DUMMY_ORDERS.filter(order => order.customerId === currentUser.id);

    const ordersPlaced = customerOrders.length;
    const ordersReady = customerOrders.filter(order => order.status === 'READY' || order.status === 'DELIVERED' || order.status === 'PICKED_UP').length;
    const recentActivities = DUMMY_ACTIVITIES.filter(activity => activity.role === ROLES.CUSTOMER).slice(0, 5);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-xl">Customer Dashboard</h1>
            <div className="card-grid mb-xl">
                <KPICard title="Orders Placed" value={ordersPlaced} icon="list-alt" trend="up" trendValue="+2 recent" />
                <KPICard title="Orders Ready" value={ordersReady} icon="check-circle" trend="up" trendValue="+1 today" />
            </div>

            <div className="card-grid mb-xl" style={{ gridTemplateColumns: '1fr' }}>
                <ChartCard title="My Order Status" type="Donut" onClick={() => navigateTo('OrdersList')} />
            </div>

            <h2 className="text-2xl font-bold mb-md">My Recent Activities</h2>
            <div className="card-grid mb-xl">
                {recentActivities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                ))}
            </div>

            <h2 className="text-2xl font-bold mb-md">My Orders</h2>
            <div className="card-grid">
                {customerOrders.length > 0 ? (
                    customerOrders.map(order => (
                        <ColorfulCard
                            key={order.id}
                            id={order.id}
                            status={order.status}
                            title={`Order ${order.id}`}
                            description={`${order.items.reduce((sum, item) => sum + item.qty, 0)} items | Total: $${order.totalPrice}`}
                            kpi={order.status}
                            footer={`Due: ${new Date(order.dueDate).toLocaleDateString()}`}
                            onClick={(id) => navigateTo('OrderDetailView', { orderId: id })}
                        />
                    ))
                ) : (
                    <div className="p-lg text-center text-secondary rounded-md shadow-md" style={{ backgroundColor: 'var(--color-bg-light)' }}>
                        <p className="text-lg mb-sm">No orders yet.</p>
                        <Button onClick={() => navigateTo('OrderForm')} icon="plus">Place New Order</Button>
                    </div>
                )}
            </div>
            <div className="flex justify-center mt-xl">
                 <Button variant="outline" icon="plus" onClick={() => navigateTo('OrderForm')}>Place New Order</Button>
            </div>
        </div>
    );
};

const ServiceProviderDashboard = () => {
    const { navigateTo } = useNavigation();
    const { currentUser } = useAuth();
    const spId = DUMMY_USERS.find(u => u.id === currentUser.id)?.id || 'p1'; // Assume SP role matches partner ID for dummy
    const spOrders = DUMMY_ORDERS.filter(order => order.serviceProviderId === spId);

    const ordersReceived = spOrders.length;
    const ordersInProgress = spOrders.filter(order => order.status === 'ACCEPTED' || order.status === 'IRONING').length;
    const ordersCompleted = spOrders.filter(order => order.status === 'READY' || order.status === 'DELIVERED' || order.status === 'PICKED_UP').length;
    const deliveriesScheduled = spOrders.filter(order => order.status === 'READY' && order.deliveryOption === 'Doorstep').length;
    const recentActivities = DUMMY_ACTIVITIES.filter(activity => activity.role === ROLES.SERVICE_PROVIDER).slice(0, 5);
    const upcomingDeadlines = spOrders.filter(order => order.status !== 'DELIVERED' && order.status !== 'PICKED_UP').sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0,3);


    return (
        <div>
            <h1 className="text-3xl font-bold mb-xl">Service Provider Dashboard</h1>
            <div className="card-grid mb-xl">
                <KPICard title="Orders Received" value={ordersReceived} icon="inbox" trend="up" trendValue="+3 recent" />
                <KPICard title="Orders In Progress" value={ordersInProgress} icon="cogs" trend="neutral" trendValue="-" />
                <KPICard title="Orders Completed" value={ordersCompleted} icon="check-double" trend="up" trendValue="+2 today" />
                <KPICard title="Deliveries Scheduled" value={deliveriesScheduled} icon="truck-moving" trend="up" trendValue="+1 today" />
            </div>

            <div className="card-grid mb-xl" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <ChartCard title="Orders by Status" type="Bar" onClick={() => navigateTo('OrdersQueue')} />
                <ChartCard title="Daily Volume Trend" type="Line" onClick={() => navigateTo('OrdersQueue')} />
            </div>

            <h2 className="text-2xl font-bold mb-md">Upcoming Deadlines</h2>
            <div className="card-grid mb-xl">
                {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map(order => (
                        <ColorfulCard
                            key={order.id}
                            id={order.id}
                            status={order.status}
                            title={`Order ${order.id}`}
                            description={`Customer: ${order.customerName} | ${order.deliveryOption}`}
                            kpi={`Due: ${new Date(order.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            footer={`Status: ${order.status}`}
                            onClick={(id) => navigateTo('OrderDetailView', { orderId: id })}
                        />
                    ))
                ) : (
                    <div className="p-lg text-center text-secondary rounded-md shadow-md" style={{ backgroundColor: 'var(--color-bg-light)' }}>
                        <p className="text-lg mb-sm">No upcoming deadlines.</p>
                        <Button onClick={() => navigateTo('OrdersQueue')} icon="list-alt">View Orders Queue</Button>
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-bold mb-md">Recent Activities</h2>
            <div className="card-grid mb-xl">
                {recentActivities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                ))}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { navigateTo } = useNavigation();
    const totalOrders = DUMMY_ORDERS.length;
    const totalRevenue = DUMMY_ORDERS.reduce((sum, order) => sum + order.totalPrice, 0);
    const avgTurnaroundTime = DUMMY_ORDERS.length > 0
        ? (DUMMY_ORDERS.filter(o => o.status === 'DELIVERED' || o.status === 'PICKED_UP').reduce((sum, order) => {
            const created = new Date(order.createdAt);
            const completedStage = order.timeline.find(t => t.stage === 'Delivered' || t.stage === 'Picked Up');
            if (completedStage) {
                const completed = new Date(completedStage.date);
                return sum + (completed.getTime() - created.getTime());
            }
            return sum;
        }, 0) / (1000 * 60 * 60 * DUMMY_ORDERS.filter(o => o.status === 'DELIVERED' || o.status === 'PICKED_UP').length))
        .toFixed(1) : 0; // Avg hours
    const deliveryVsPickup = {
        delivery: DUMMY_ORDERS.filter(o => o.deliveryOption === 'Doorstep').length,
        pickup: DUMMY_ORDERS.filter(o => o.deliveryOption === 'Customer Pickup').length,
    };
    const recentActivities = DUMMY_ACTIVITIES.slice(0, 5);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-xl">Admin Dashboard</h1>
            <div className="card-grid mb-xl">
                <KPICard title="Total Orders" value={totalOrders} icon="receipt" trend="up" trendValue="+10% MoM" />
                <KPICard title="Total Revenue" value={`$${totalRevenue}`} icon="dollar-sign" trend="up" trendValue="+15% MoM" />
                <KPICard title="Avg. Turnaround Time" value={`${avgTurnaroundTime} hrs`} icon="clock" trend="down" trendValue="-0.5 hrs" />
                <KPICard title="Delivery vs Pickup" value={`${deliveryVsPickup.delivery} / ${deliveryVsPickup.pickup}`} icon="shipping-fast" trend="neutral" trendValue="-" />
            </div>

            <div className="card-grid mb-xl" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <ChartCard title="Revenue Trend" type="Line" onClick={() => navigateTo('OrdersList')} />
                <ChartCard title="Delivery vs Pickup Distribution" type="Pie" onClick={() => navigateTo('OrdersList')} />
            </div>

            <h2 className="text-2xl font-bold mb-md">Recent Activities</h2>
            <div className="card-grid mb-xl">
                {recentActivities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                ))}
            </div>

            <h2 className="text-2xl font-bold mb-md">Quick Actions</h2>
            <div className="card-grid">
                <ColorfulCard
                    status="DRAFT"
                    title="Manage Rates"
                    description="Set up and update pricing for different cloth types."
                    kpi="Rates"
                    onClick={() => navigateTo('RateSetupForm')}
                    footer="Pricing controls"
                />
                <ColorfulCard
                    status="ACTIVE"
                    title="Manage Partners"
                    description="Add, edit, or deactivate ironing service providers."
                    kpi="Partners"
                    onClick={() => navigateTo('PartnersList')}
                    footer="Provider management"
                />
                <ColorfulCard
                    status="CREATED"
                    title="View All Orders"
                    description="Monitor all customer orders and their statuses."
                    kpi="Orders"
                    onClick={() => navigateTo('OrdersList')}
                    footer="Order oversight"
                />
            </div>
        </div>
    );
};

// --- Lists ---
const OrdersList = ({ orders, onOrderClick, allowedActions }) => {
    const { currentUser } = useAuth();
    const { addNotification } = useNotifications();
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterDelivery, setFilterDelivery] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
        const matchesDelivery = filterDelivery === 'ALL' || order.deliveryOption === filterDelivery;
        const matchesSearch = searchTerm === '' ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.serviceProviderName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesDelivery && matchesSearch;
    });

    const handleBulkAction = (action) => {
        addNotification({ type: 'info', title: 'Bulk Action', message: `Bulk action "${action}" initiated on selected orders.` });
    };

    const hasBulkActions = allowedActions.some(action => ['bulkAccept', 'bulkComplete'].includes(action));

    return (
        <div>
            <h1 className="text-3xl font-bold mb-xl">All Orders</h1>

            <div className="flex gap-md mb-md items-center">
                <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[{ value: 'ALL', label: 'All Statuses' }, ...Object.keys(STATUS_COLORS).map(s => ({ value: s, label: s.replace(/_/g, ' ') }))]}
                />
                <Select
                    value={filterDelivery}
                    onChange={(e) => setFilterDelivery(e.target.value)}
                    options={[{ value: 'ALL', label: 'All Deliveries' }, { value: 'Doorstep', label: 'Doorstep' }, { value: 'Customer Pickup', label: 'Customer Pickup' }]}
                />
                {hasBulkActions && (
                    <>
                        <Button variant="outline" icon="layer-group" onClick={() => handleBulkAction('accept')}>Bulk Accept</Button>
                        <Button variant="outline" icon="check-double" onClick={() => handleBulkAction('complete')}>Bulk Complete</Button>
                    </>
                )}
                {currentUser.role === ROLES.CUSTOMER && <Button variant="primary" icon="plus" onClick={() => onOrderClick('new')}>Place New Order</Button>}
                {currentUser.role === ROLES.ADMIN && <Button variant="outline" icon="file-export" onClick={() => addNotification({type: 'info', title: 'Export', message: 'Orders exported to Excel.'})}>Export to Excel</Button>}
            </div>

            <div className="card-grid">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <ColorfulCard
                            key={order.id}
                            id={order.id}
                            status={order.status}
                            title={`Order ${order.id}`}
                            description={`Customer: ${order.customerName} | Total: $${order.totalPrice}`}
                            kpi={order.status}
                            footer={`Delivery: ${order.deliveryOption} | Due: ${new Date(order.dueDate).toLocaleDateString()}`}
                            onClick={(id) => onOrderClick(id)}
                            actions={[]} // Quick actions (hover/swipe) are conceptual for prototype, not fully implemented with forms here
                        />
                    ))
                ) : (
                    <div className="p-lg text-center text-secondary rounded-md shadow-md" style={{ backgroundColor: 'var(--color-bg-light)', gridColumn: '1 / -1' }}>
                        <p className="text-lg mb-sm">No orders found matching your criteria.</p>
                        {currentUser.role === ROLES.CUSTOMER && <Button onClick={() => onOrderClick('new')} icon="plus">Place New Order</Button>}
                    </div>
                )}
            </div>
        </div>
    );
};

const PartnersList = ({ partners, onPartnerClick, onAddPartner }) => {
    const { addNotification } = useNotifications();
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPartners = partners.filter(partner => {
        const matchesStatus = filterStatus === 'ALL' || partner.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            partner.contact.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-xl">Ironing Partners</h1>

            <div className="flex gap-md mb-md items-center">
                <Input
                    type="text"
                    placeholder="Search partners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[{ value: 'ALL', label: 'All Statuses' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
                />
                <Button variant="primary" icon="plus" onClick={onAddPartner}>Add New Partner</Button>
                <Button variant="outline" icon="file-export" onClick={() => addNotification({type: 'info', title: 'Export', message: 'Partners exported to Excel.'})}>Export to Excel</Button>
            </div>

            <div className="card-grid">
                {filteredPartners.length > 0 ? (
                    filteredPartners.map(partner => (
                        <ColorfulCard
                            key={partner.id}
                            id={partner.id}
                            status={partner.status}
                            title={partner.name}
                            description={`Contact: ${partner.contact}`}
                            kpi={partner.status}
                            footer={`ID: ${partner.id}`}
                            onClick={(id) => onPartnerClick(id)}
                        />
                    ))
                ) : (
                    <div className="p-lg text-center text-secondary rounded-md shadow-md" style={{ backgroundColor: 'var(--color-bg-light)', gridColumn: '1 / -1' }}>
                        <p className="text-lg mb-sm">No partners found matching your criteria.</p>
                        <Button onClick={onAddPartner} icon="plus">Add New Partner</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- App Structure ---
const App = () => {
    const [currentUser, setCurrentUser] = useState(DUMMY_USERS[0]); // Default to Admin for demo
    const [currentScreen, setCurrentScreen] = useState({ name: 'AdminDashboard', params: {} });
    const [screenHistory, setScreenHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [allOrders, setAllOrders] = useState(DUMMY_ORDERS);
    const [allPartners, setAllPartners] = useState(DUMMY_PARTNERS);
    const [allRates, setAllRates] = useState(DUMMY_RATES);

    useEffect(() => {
        document.body.className = darkMode ? 'dark-mode' : '';
    }, [darkMode]);

    const login = (roleId) => {
        const user = DUMMY_USERS.find(u => u.id === roleId);
        if (user) {
            setCurrentUser(user);
            setScreenHistory([]);
            if (user.role === ROLES.ADMIN) setCurrentScreen({ name: 'AdminDashboard', params: {} });
            if (user.role === ROLES.CUSTOMER) setCurrentScreen({ name: 'CustomerDashboard', params: {} });
            if (user.role === ROLES.SERVICE_PROVIDER) setCurrentScreen({ name: 'ServiceProviderDashboard', params: {} });
            addNotification({ type: 'success', title: 'Login Successful', message: `Welcome, ${user.name}!` });
        } else {
            addNotification({ type: 'error', title: 'Login Failed', message: 'Invalid user selected.' });
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentScreen({ name: 'Login', params: {} });
        setScreenHistory([]);
        addNotification({ type: 'info', title: 'Logged Out', message: 'You have been logged out.' });
    };

    const navigateTo = (screenName, params = {}) => {
        setScreenHistory((prev) => [...prev, currentScreen]);
        setCurrentScreen({ name: screenName, params });
    };

    const goBack = () => {
        if (screenHistory.length > 0) {
            const previousScreen = screenHistory.pop();
            setScreenHistory([...screenHistory]); // Update state to trigger re-render if needed
            setCurrentScreen(previousScreen);
        }
    };

    const addNotification = (notification) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, ...notification }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    };

    const canAccess = (resourceType, resourceName) => {
        if (!currentUser) return false;
        const rolePermissions = PERMISSIONS[currentUser.role];
        return rolePermissions && rolePermissions[resourceType]?.includes(resourceName);
    };

    const handleOrderAction = (orderId, actionType) => {
        setAllOrders(prevOrders => prevOrders.map(order => {
            if (order.id === orderId) {
                let newStatus = order.status;
                const newTimelineEntry = { date: new Date().toISOString(), actor: currentUser.name };
                switch (actionType) {
                    case 'accept': newStatus = 'ACCEPTED'; newTimelineEntry.stage = 'Accepted'; break;
                    case 'ironing': newStatus = 'IRONING'; newTimelineEntry.stage = 'Ironing'; break;
                    case 'ready': newStatus = 'READY'; newTimelineEntry.stage = 'Ready'; break;
                    case 'delivered': newStatus = 'DELIVERED'; newTimelineEntry.stage = 'Delivered'; break;
                    case 'pickedUp': newStatus = 'PICKED_UP'; newTimelineEntry.stage = 'Picked Up'; break;
                    default: return order;
                }
                addNotification({ type: 'success', title: 'Order Update', message: `Order ${orderId} status changed to ${newStatus}.` });
                return {
                    ...order,
                    status: newStatus,
                    timeline: [...order.timeline, newTimelineEntry],
                };
            }
            return order;
        }));
    };

    const handleFormSubmit = (formType, data) => {
        if (formType === 'order') {
            if (data.id) { // Edit existing order
                setAllOrders(prevOrders => prevOrders.map(o => o.id === data.id ? { ...o, ...data } : o));
            } else { // New order
                const newOrderId = `O${String(allOrders.length + 1).padStart(3, '0')}`;
                setAllOrders(prevOrders => [
                    ...prevOrders,
                    {
                        ...data,
                        id: newOrderId,
                        createdAt: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
                        timeline: [{ stage: 'Created', date: new Date().toISOString(), actor: currentUser.name }],
                    }
                ]);
            }
        } else if (formType === 'partner') {
            if (data.id) { // Edit existing partner
                setAllPartners(prevPartners => prevPartners.map(p => p.id === data.id ? { ...p, ...data } : p));
            } else { // New partner
                const newPartnerId = `p${String(allPartners.length + 1).padStart(1, '0')}`;
                setAllPartners(prevPartners => [...prevPartners, { ...data, id: newPartnerId }]);
            }
        } else if (formType === 'rate') {
            if (allRates.some(r => r.type === data.type)) { // Edit existing rate
                setAllRates(prevRates => prevRates.map(r => r.type === data.type ? { ...r, price: data.price } : r));
            } else { // New rate
                setAllRates(prevRates => [...prevRates, data]);
            }
        }
        goBack(); // Return to previous screen after form submit
    };

    const renderContent = () => {
        if (!currentUser) {
            return (
                <div className="full-screen-view justify-center items-center">
                    <div className="form-container text-center">
                        <h1 className="text-3xl font-bold mb-xl">Welcome to IronEclipse</h1>
                        <p className="mb-lg">Please select a user role to log in:</p>
                        <div className="flex flex-col gap-md">
                            {DUMMY_USERS.map(user => (
                                <Button key={user.id} onClick={() => login(user.id)} variant="primary" icon="user">
                                    Login as {user.name} ({user.role})
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        const screen = currentScreen;
        if (screen.name === 'AdminDashboard' && canAccess('dashboards', 'AdminDashboard')) {
            return <AdminDashboard />;
        }
        if (screen.name === 'CustomerDashboard' && canAccess('dashboards', 'CustomerDashboard')) {
            return <CustomerDashboard />;
        }
        if (screen.name === 'ServiceProviderDashboard' && canAccess('dashboards', 'ServiceProviderDashboard')) {
            return <ServiceProviderDashboard />;
        }
        if (screen.name === 'OrdersList' && (canAccess('lists', 'OrdersList') || canAccess('lists', 'OrdersQueue'))) {
            const ordersToShow = currentUser.role === ROLES.CUSTOMER
                ? allOrders.filter(o => o.customerId === currentUser.id)
                : currentUser.role === ROLES.SERVICE_PROVIDER
                    ? allOrders.filter(o => o.serviceProviderId === DUMMY_PARTNERS.find(p => p.name === currentUser.name)?.id) // Simple mapping
                    : allOrders;
            return <OrdersList orders={ordersToShow} onOrderClick={(id) => navigateTo(id === 'new' ? 'OrderForm' : 'OrderDetailView', { orderId: id })} allowedActions={PERMISSIONS[currentUser.role].actions} />;
        }
        if (screen.name === 'PartnersList' && canAccess('lists', 'PartnersList')) {
            return <PartnersList partners={allPartners} onPartnerClick={(id) => navigateTo('PartnerDetailView', { partnerId: id })} onAddPartner={() => navigateTo('PartnerSetupForm')} />;
        }
        if (screen.name === 'OrderDetailView') {
            const order = allOrders.find(o => o.id === screen.params.orderId);
            if (!order) return <p className="p-xl text-center">Order not found.</p>;

            // Record-level security: Customers only see their own orders
            if (currentUser.role === ROLES.CUSTOMER && order.customerId !== currentUser.id) {
                return <p className="p-xl text-center text-danger">Access Denied: You do not have permission to view this order.</p>;
            }
            // Service Provider only sees assigned orders
            if (currentUser.role === ROLES.SERVICE_PROVIDER && order.serviceProviderId !== DUMMY_PARTNERS.find(p => p.name === currentUser.name)?.id) {
                return <p className="p-xl text-center text-danger">Access Denied: You do not have permission to view this order.</p>;
            }

            return <OrderDetailView order={order} goBack={goBack} onAction={handleOrderAction} canPerformAction={(action) => canAccess('actions', action)} />;
        }
        if (screen.name === 'PartnerDetailView' && canAccess('lists', 'PartnersList')) {
            const partner = allPartners.find(p => p.id === screen.params.partnerId);
            if (!partner) return <p className="p-xl text-center">Partner not found.</p>;
            return <PartnerDetailView partner={partner} goBack={goBack} onEdit={(p) => navigateTo('PartnerSetupForm', { partnerData: p, isEdit: true })} />;
        }
        if (screen.name === 'OrderForm' && canAccess('forms', 'OrderForm')) {
            const initialOrderData = screen.params.orderData || {};
            const isEdit = screen.params.isEdit || false;
            return <OrderForm initialData={initialOrderData} onSubmit={(data) => handleFormSubmit('order', data)} onCancel={goBack} customerId={currentUser.id} isEdit={isEdit} />;
        }
        if (screen.name === 'OrderUpdateForm' && canAccess('forms', 'OrderUpdateForm')) {
            const initialOrderData = allOrders.find(o => o.id === screen.params.orderId);
            if (!initialOrderData) return <p className="p-xl text-center">Order to update not found.</p>;
            return <OrderForm initialData={initialOrderData} onSubmit={(data) => handleFormSubmit('order', data)} onCancel={goBack} isEdit={true} />;
        }
        if (screen.name === 'RateSetupForm' && canAccess('forms', 'RateSetupForm')) {
            const initialRateData = screen.params.rateData || {};
            const isEdit = screen.params.isEdit || false;
            return <RateSetupForm initialData={initialRateData} onSubmit={(data) => handleFormSubmit('rate', data)} onCancel={goBack} isEdit={isEdit} />;
        }
        if (screen.name === 'PartnerSetupForm' && canAccess('forms', 'PartnerSetupForm')) {
            const initialPartnerData = screen.params.partnerData || {};
            const isEdit = screen.params.isEdit || false;
            return <PartnerSetupForm initialData={initialPartnerData} onSubmit={(data) => handleFormSubmit('partner', data)} onCancel={goBack} isEdit={isEdit} />;
        }
        if (screen.name === 'RegistrationForm' && canAccess('forms', 'RegistrationForm')) {
             return <RegistrationForm onSubmit={(data) => {addNotification({type: 'success', title: 'Registration Success', message: `User ${data.name} registered.`}); goBack();}} onCancel={goBack} />;
        }

        return <p className="p-xl text-center text-danger">Access Denied or Screen Not Found: {screen.name}</p>;
    };

    const isFullScreenMode = currentScreen.name.includes('DetailView') || currentScreen.name.includes('Form');

    return (
        <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
            <AuthContext.Provider value={{ currentUser, login, logout, canAccess }}>
                <NavigationContext.Provider value={{ navigateTo, goBack, currentScreen, screenHistory }}>
                    <NotificationContext.Provider value={{ addNotification }}>
                        <div className={`app-container ${isFullScreenMode ? 'full-screen-mode' : ''}`}>
                            <Header />
                            {!isFullScreenMode && <Sidebar />}
                            <main className="main-content">
                                {renderContent()}
                            </main>
                            <div className="notification-container">
                                {notifications.map((n) => (
                                    <NotificationToast key={n.id} notification={n} />
                                ))}
                            </div>
                        </div>
                    </NotificationContext.Provider>
                </NavigationContext.Provider>
            </AuthContext.Provider>
        </ThemeContext.Provider>
    );
};

const Header = () => {
    const { currentUser, canAccess, logout } = useAuth();
    const { navigateTo } = useNavigation();
    const { darkMode, setDarkMode } = useTheme();
    const { addNotification } = useNotifications();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        if (searchTerm.trim()) {
            addNotification({ type: 'info', title: 'Search Initiated', message: `Searching for "${searchTerm}"... (Conceptual)` });
            // Conceptual global search logic
        }
    };

    return (
        <header className="header">
            <div className="header-logo">IronEclipse</div>
            <div className="header-right">
                <div className="search-bar">
                    <Input
                        type="text"
                        placeholder="Global Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={handleSearch} className="icon-button" icon="search" />
                </div>
                <Button className="icon-button" icon={darkMode ? 'sun' : 'moon'} onClick={() => setDarkMode(!darkMode)} />
                <Button className="icon-button" icon="bell" onClick={() => addNotification({ type: 'info', title: 'New Notification', message: 'You have a new message!' })} />
                {currentUser && (
                    <>
                        <div className="user-avatar">{currentUser.avatar}</div>
                        <Button variant="outline" onClick={logout} icon="sign-out-alt">Logout</Button>
                    </>
                )}
            </div>
        </header>
    );
};

const Sidebar = () => {
    const { currentUser, canAccess, logout } = useAuth();
    const { navigateTo, currentScreen } = useNavigation();

    const navItems = [
        {
            role: ROLES.ADMIN,
            heading: 'Admin Console',
            links: [
                { name: 'AdminDashboard', label: 'Dashboard', icon: 'tachometer-alt' },
                { name: 'OrdersList', label: 'All Orders', icon: 'receipt' },
                { name: 'PartnersList', label: 'Ironing Partners', icon: 'handshake' },
                { name: 'RateSetupForm', label: 'Manage Rates', icon: 'dollar-sign' },
            ],
        },
        {
            role: ROLES.CUSTOMER,
            heading: 'My Ironing',
            links: [
                { name: 'CustomerDashboard', label: 'Dashboard', icon: 'tachometer-alt' },
                { name: 'OrdersList', label: 'My Orders', icon: 'list-alt' },
                { name: 'OrderForm', label: 'Place New Order', icon: 'plus-circle' },
            ],
        },
        {
            role: ROLES.SERVICE_PROVIDER,
            heading: 'Partner Hub',
            links: [
                { name: 'ServiceProviderDashboard', label: 'Dashboard', icon: 'tachometer-alt' },
                { name: 'OrdersList', label: 'Orders Queue', icon: 'tasks' },
            ],
        },
    ];

    const currentRoleNav = navItems.find(item => item.role === currentUser.role);

    return (
        <aside className="sidebar">
            {currentRoleNav && (
                <>
                    <div className="sidebar-heading">{currentRoleNav.heading}</div>
                    <nav>
                        {currentRoleNav.links.map(link => canAccess('dashboards', link.name) || canAccess('lists', link.name) || canAccess('forms', link.name) ? (
                            <button
                                key={link.name}
                                className={`sidebar-nav-item ${currentScreen.name === link.name ? 'active' : ''}`}
                                onClick={() => navigateTo(link.name)}
                            >
                                <Icon name={link.icon} />
                                {link.label}
                            </button>
                        ) : null)}
                    </nav>
                </>
            )}
             <button className="sidebar-nav-item logout" onClick={logout}>
                <Icon name="sign-out-alt" />
                Logout
            </button>
        </aside>
    );
}
export default App;
