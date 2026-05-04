export const JournalIllustration = () => {
	return (
		<svg
			viewBox="0 0 400 400"
			width="100%"
			height="100%"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<defs>
				{/* Main brand gradients */}
				<linearGradient
					id="mainGrad"
					x1="50"
					y1="50"
					x2="350"
					y2="350"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor="#3525CD" stopOpacity="0.15" />
					<stop offset="100%" stopColor="#7E3000" stopOpacity="0.05" />
				</linearGradient>

				<linearGradient
					id="bookCover"
					x1="100"
					y1="100"
					x2="300"
					y2="350"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor="#3525CD" />
					<stop offset="100%" stopColor="#1E138A" />
				</linearGradient>

				<linearGradient id="pageGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#FFFFFF" />
					<stop offset="100%" stopColor="#F7F9FB" />
				</linearGradient>

				<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur in="SourceAlpha" stdDeviation="12" />
					<feOffset dx="0" dy="10" />
					<feComponentTransfer>
						<feFuncA type="linear" slope="0.15" />
					</feComponentTransfer>
					<feMerge>
						<feMergeNode />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="20" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			{/* Decorative background elements */}
			<circle cx="200" cy="200" r="170" fill="url(#mainGrad)" />
			<circle cx="340" cy="80" r="40" fill="#3525CD" fillOpacity="0.04" />
			<circle cx="60" cy="320" r="30" fill="#7E3000" fillOpacity="0.05" />

			{/* Floating "Data" or "Giving" accents */}
			<g
				filter="url(#softShadow)"
				className="animate-bounce"
				style={{ animationDuration: "4s" }}
			>
				<rect
					x="310"
					y="140"
					width="40"
					height="40"
					rx="12"
					fill="white"
					fillOpacity="0.9"
				/>
				<path
					d="M322 160 L328 166 L338 156"
					stroke="#3525CD"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>

			{/* The Journal / Bible */}
			<g filter="url(#softShadow)">
				{/* Shadow/Back page */}
				<rect
					x="95"
					y="105"
					width="210"
					height="260"
					rx="12"
					fill="#000"
					fillOpacity="0.1"
				/>

				{/* Book Cover */}
				<rect
					x="90"
					y="100"
					width="210"
					height="260"
					rx="12"
					fill="url(#bookCover)"
				/>

				{/* Paper edges effect */}
				<rect
					x="105"
					y="100"
					width="195"
					height="255"
					rx="4"
					fill="white"
					fillOpacity="0.2"
				/>

				{/* Open Pages Area */}
				<rect
					x="105"
					y="110"
					width="185"
					height="240"
					rx="8"
					fill="url(#pageGrad)"
				/>

				{/* Spine / Center crease */}
				<line
					x1="197"
					y1="110"
					x2="197"
					y2="350"
					stroke="#3525CD"
					strokeWidth="0.5"
					strokeOpacity="0.2"
				/>

				{/* Left Page Content (Text lines) */}
				<g opacity="0.4">
					{[140, 165, 190, 215, 240, 265].map((y, i) => (
						<rect
							key={y}
							x="120"
							y={y}
							width={i % 2 === 0 ? 60 : 45}
							height="3"
							rx="1.5"
							fill="#3525CD"
						/>
					))}
				</g>

				{/* Right Page Content (Chart/Heart) */}
				<g transform="translate(210, 140)">
					{/* Subtle heart for "Giving/Heart" */}
					<path
						d="M20 10 C15 0 0 0 0 10 C0 18 20 28 20 28 C20 28 40 18 40 10 C40 0 25 0 20 10"
						fill="#7E3000"
						fillOpacity="0.15"
						transform="translate(15, 60)"
					/>
					{[0, 1, 2].map((i) => (
						<rect
							key={i}
							x="0"
							y={i * 25}
							width={65}
							height="12"
							rx="4"
							fill="#3525CD"
							fillOpacity="0.08"
						/>
					))}
				</g>

				{/* Bookmark */}
				<path
					d="M245 100 V280 L260 265 L275 280 V100 Z"
					fill="#7E3000"
					filter="url(#glow)"
				/>
			</g>

			{/* Floating Coin/Token representation */}
			<g
				filter="url(#softShadow)"
				className="animate-bounce"
				style={{ animationDuration: "6s", animationDelay: "1s" }}
			>
				<circle cx="80" cy="180" r="22" fill="white" fillOpacity="0.95" />
				<text
					x="73"
					y="187"
					fill="#3525CD"
					fontSize="20"
					fontWeight="bold"
					fontFamily="sans-serif"
				>
					₱
				</text>
			</g>

			{/* Floating Pencil / Stylus */}
			<g transform="rotate(-15 320 300)" filter="url(#softShadow)">
				<rect x="300" y="220" width="10" height="150" rx="5" fill="#3525CD" />
				<rect
					x="300"
					y="220"
					width="10"
					height="20"
					rx="2"
					fill="#7E3000"
					fillOpacity="0.8"
				/>
				<path d="M300 370 L305 385 L310 370 Z" fill="#E6E6FA" />
			</g>
		</svg>
	);
};
