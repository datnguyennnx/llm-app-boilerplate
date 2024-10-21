"""change conversation and message id to uuid

Revision ID: 20230923_001
Revises: 20230922_001
Create Date: 2023-09-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '20230923_001'
down_revision = '20230922_001'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the foreign key constraint first
    op.drop_constraint('messages_conversation_id_fkey', 'messages', type_='foreignkey')

    # Drop primary key constraints
    op.drop_constraint('conversations_pkey', 'conversations', type_='primary')
    op.drop_constraint('messages_pkey', 'messages', type_='primary')

    # Conversations table
    op.add_column('conversations', sa.Column('new_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE conversations SET new_id = uuid_generate_v4()")
    op.alter_column('conversations', 'new_id', nullable=False)
    op.drop_column('conversations', 'id')
    op.alter_column('conversations', 'new_id', new_column_name='id')
    op.create_primary_key('conversations_pkey', 'conversations', ['id'])

    # Messages table
    op.add_column('messages', sa.Column('new_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE messages SET new_id = uuid_generate_v4()")
    op.alter_column('messages', 'new_id', nullable=False)
    op.drop_column('messages', 'id')
    op.alter_column('messages', 'new_id', new_column_name='id')
    op.create_primary_key('messages_pkey', 'messages', ['id'])

    # Update foreign key in messages table
    op.add_column('messages', sa.Column('new_conversation_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE messages m SET new_conversation_id = c.id::uuid FROM conversations c WHERE m.conversation_id::text = c.id::text")
    op.drop_column('messages', 'conversation_id')
    op.alter_column('messages', 'new_conversation_id', new_column_name='conversation_id')
    op.create_foreign_key('messages_conversation_id_fkey', 'messages', 'conversations', ['conversation_id'], ['id'])

def downgrade():
    # This downgrade function is not reversible due to potential data loss
    raise NotImplementedError("Downgrade is not supported for this migration")
