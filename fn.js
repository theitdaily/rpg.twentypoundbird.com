const nav = document.getElementById('nav');
const btn = document.getElementById('menuButton');
btn.addEventListener('click', () => {
	const open = nav.classList.toggle('open');btn.setAttribute('aria-expanded', String(open));btn.textContent = open ? '✕' : '☰'
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
	nav.classList.remove('open');btn.setAttribute('aria-expanded', 'false');btn.textContent = '☰'
}));
const ruleFilters = document.querySelectorAll('.rule-filter');
const ruleItems = document.querySelectorAll('.rules .rule');
ruleFilters.forEach(filter => filter.addEventListener('click', () => {
	const value = filter.dataset.filter;
	ruleFilters.forEach(item => {
		item.classList.toggle('is-selected', item === filter);item.setAttribute('aria-pressed', String(item === filter));
	});
		ruleItems.forEach(rule => rule.classList.toggle('is-hidden', value !== 'all' && !rule.classList.contains(value)));
}));

const campaignTimeZone = 'Europe/Belgrade';
const visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const getOffsetMinutes = (timeZone, date) => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(date).reduce((result, part) => {
		if (part.type !== 'literal') result[part.type] = Number(part.value);
		return result;
	}, {});

	const utcValue = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
	return Math.round((utcValue - Math.floor(date.getTime() / 1000) * 1000) / 60000);
};

const normaliseMinutes = minutes => ((minutes % 1440) + 1440) % 1440;
const dayShift = minutes => Math.floor(minutes / 1440);
const formatTime = minutes => {
	const normalised = normaliseMinutes(minutes);
	return String(Math.floor(normalised / 60)).padStart(2, '0') + ':' + String(normalised % 60).padStart(2, '0');
};

const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const shiftWeekday = (day, shift) => ((day + shift) % 7 + 7) % 7;
const formatDayRange = days => {
	if (days.length === 1) return dayNames[days[0]];
	const consecutive = days.every((day, index) => index === 0 || day === (days[index - 1] + 1) % 7);
	return consecutive ? dayNames[days[0]] + '–' + dayNames[days[days.length - 1]] : days.map(day => dayNames[day]).join(', ');
};

try {
	const now = new Date();
	const campaignOffset = getOffsetMinutes(campaignTimeZone, now);
	const visitorOffset = getOffsetMinutes(visitorTimeZone, now);
	const difference = visitorOffset - campaignOffset;
	document.querySelectorAll('.schedule-slot').forEach(slot => {
		const days = slot.dataset.days.split(',').map(Number);
		const [startHours, startMinutes] = slot.dataset.start.split(':').map(Number);
		const [endHours, endMinutes] = slot.dataset.end.split(':').map(Number);
		const convertedStart = startHours * 60 + startMinutes + difference;
		const convertedEnd = endHours * 60 + endMinutes + difference;
		const startDayShift = dayShift(convertedStart);
		const endDayShift = dayShift(convertedEnd);
		const convertedDays = days.map(day => shiftWeekday(day, startDayShift));
		const crossesDate = endDayShift !== startDayShift;

		slot.querySelector('.schedule-days').textContent = formatDayRange(convertedDays);
		slot.querySelector('.schedule-hours').textContent = formatTime(convertedStart) + '–' + formatTime(convertedEnd) + (crossesDate ? ' следующего дня' : '');
	});
} catch (error) {
	// Если часовой пояс определить не удалось, остаётся исходное время по Белграду.
}