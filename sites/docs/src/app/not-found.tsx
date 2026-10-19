import { ErrorPage } from '../components/ErrorPage'

export const metadata = {
	title: 'Page not found',
}

const NotFound = () => <ErrorPage status={404} />

export default NotFound
