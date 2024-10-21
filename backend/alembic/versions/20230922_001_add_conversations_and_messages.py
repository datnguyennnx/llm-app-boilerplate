"""add conversations and messages

Revision ID: 20230922_001
Revises: 20230921_001
Create Date: 2023-09-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20230922_001'
down_revision = '20230921_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)

    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('conversation_id', sa.BigInteger(), nullable=True),
        sa.Column('sender', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint("sender IN ('user', 'llm')"),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)


def downgrade():
    # Drop messages table
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')

    # Drop conversations table
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_table('conversations')
