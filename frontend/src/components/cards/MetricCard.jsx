export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subtitle = '',
  trend = null,
  onClick = null,
  interactive = false,
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  };
  const interactiveClasses = interactive ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300' : '';

  const handleKeyDown = (event) => {
    if (!interactive || !onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  const handleClick = (event) => {
    if (!interactive || !onClick) return;
    onClick(event);
  };
  
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 ${colors[color]} ${interactiveClasses}`}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors[color]} bg-opacity-10`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
        </p>
      )}
    </div>
  );
}
