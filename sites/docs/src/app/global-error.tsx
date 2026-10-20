'use client'

import Error from './error'
import '@/styles/style.css'

const GlobalError = () => (
	<html lang="en">
		<head>
			<title>Something went wrong | Kirari</title>
			<meta name="robots" content="noindex" />
		</head>
		<body>
			<Error />
		</body>
	</html>
)

export default GlobalError
