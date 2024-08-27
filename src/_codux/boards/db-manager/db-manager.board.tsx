import { createBoard } from '@wixc3/react-board';
import DBManager from '../../../components/db-manager/db-manager';

export default createBoard({
    name: 'DBManager',
    Board: () => <DBManager />,
    isSnippet: true,
});
